# Authentication

simU uses JWT-based authentication with rotating, revocable refresh tokens.
This document covers how to run it, how to call it, and why it's built the
way it is.

## Setup

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `DB_PASSWORD` | Postgres password for `simu_user` | any string |
| `JWT_SECRET` | Base64-encoded signing key for JWTs, must decode to ≥256 bits for HS256 | see below |

Generate a secret:

```bash
openssl rand -base64 64
```

### Running locally

```bash
export DB_PASSWORD=yourlocalpassword
export JWT_SECRET=$(openssl rand -base64 64)

cd src/backend
docker compose up -d       # starts Postgres
./mvnw spring-boot:run     # starts the app on :8080
```

Flyway runs the migrations automatically on startup (`V1__create_users_and_monitors.sql`,
`V2__create_refresh_tokens.sql`). Check the startup logs to confirm both ran.

### Trying it out

A Postman collection (`simU-auth.postman_collection.json`) covers the full
flow, including negative cases (duplicate email, wrong password, reused
refresh token, logout revocation). Import it, set `baseUrl` if you're not on
`localhost:8080`, and run top to bottom.

## Token model

| | Access token | Refresh token |
|---|---|---|
| Lifetime | 15 minutes | 7 days |
| Storage | Stateless (not persisted) | Persisted as a SHA-256 hash in `refresh_tokens` |
| Purpose | Authorizes API requests | Exchanged for a new token pair |
| Revocable before expiry? | No | Yes |

Every JWT carries a `type` claim (`"access"` or `"refresh"`) so one can't be
used in place of the other — e.g. an access token can't be replayed against
`/api/auth/refresh` to mint a new long-lived session.

## API reference

Base path: `/api/auth` (auth) and `/api/users` (user data).

### `POST /api/auth/register`

Creates a user and returns a token pair.

**Request**
```json
{ "email": "user@example.com", "password": "at-least-8-chars" }
```

**Response — `201 Created`**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresInSeconds": 900
}
```

| Status | Reason |
|---|---|
| 400 | Validation failed (invalid email, password too short) |
| 409 | Email already registered |

---

### `POST /api/auth/login`

Verifies credentials and returns a fresh token pair.

**Request**
```json
{ "email": "user@example.com", "password": "at-least-8-chars" }
```

**Response — `200 OK`** — same shape as register.

| Status | Reason |
|---|---|
| 401 | Wrong email or password (same message for both, to avoid leaking which accounts exist) |
| 403 | Account disabled |

---

### `POST /api/auth/refresh`

Exchanges a valid, unused refresh token for a new pair. **Rotates** the
token: the one you send is immediately revoked, whether or not you use the
new one.

**Request**
```json
{ "refreshToken": "..." }
```

**Response — `200 OK`** — same shape as register.

| Status | Reason |
|---|---|
| 401 | Token invalid, expired, already used/revoked, or not a refresh-type token |

---

### `POST /api/auth/logout`

Revokes a refresh token. No access token required — the refresh token
itself is the credential. Idempotent: calling it with an already-invalid
token still succeeds, since the end state ("this token no longer works") is
already true.

**Request**
```json
{ "refreshToken": "..." }
```

**Response — `204 No Content`**

---

### `GET /api/users/me`

Returns the authenticated user's profile.

**Headers**
```
Authorization: Bearer <accessToken>
```

**Response — `200 OK`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "enabled": true,
  "createdAt": "2026-07-30T12:00:00"
}
```

| Status | Reason |
|---|---|
| 401 / 403 | Missing, invalid, or expired access token |

---

### Error shape

All 4xx errors from validation or business-rule failures share one shape:

```json
{
  "timestamp": "2026-07-30T12:00:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more fields are invalid",
  "fieldErrors": { "password": "Password must be between 8 and 72 characters" }
}
```

`fieldErrors` is only present for validation failures; other errors omit it.

## Architecture decisions

**Why DB-backed, rotating refresh tokens instead of pure stateless JWTs?**
A stateless refresh token can't be revoked before it expires — if one leaks,
it's usable for the full 7 days no matter what. Storing a hash of each
refresh token lets us revoke on logout, and rotation (revoking the old token
the instant a new one is issued) means a stolen-and-replayed token only
works once before it collides with an already-used, already-revoked record.

**Why hash the refresh token before storing it, instead of storing it raw?**
Same logic as password hashing: if the database ever leaks, the rows
shouldn't be directly usable as credentials. SHA-256 (not bcrypt) is
sufficient here because refresh tokens are already high-entropy random
strings — there's no brute-force risk to defend against like there is with
human-chosen passwords.

**Why are access tokens short-lived and stateless, but refresh tokens
long-lived and stateful?** This is a standard split: the access token is
attached to every request, so keeping it stateless avoids a DB lookup per
request. Its short lifetime limits the damage if it leaks. The refresh token
is used rarely (only to mint new access tokens), so the DB lookup cost is
negligible, and being stateful is what makes it revocable.

**Why does `/api/auth/logout` not require an access token?** The refresh
token in the request body is itself the credential being acted on —
knowing it is what proves you're allowed to revoke it. Requiring a separate,
valid access token would add friction without adding security (and would
break logout for a client whose access token already expired but who still
wants to invalidate their refresh token).

**Why the same "Invalid email or password" message on both a nonexistent
email and a wrong password?** Distinguishing the two ("no such user" vs.
"wrong password") lets an attacker enumerate which emails have accounts on
the system. A single generic message closes that leak.

**Why lowercase and trim emails before lookups/writes?** Without
normalization, `Foo@Bar.com` and `foo@bar.com` would be treated as separate
accounts, creating confusing duplicate-account bugs and letting the
uniqueness check be trivially bypassed by case alone.