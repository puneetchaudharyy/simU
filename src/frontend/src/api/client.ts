import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStorage';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// These endpoints carry their own credential (password, or the refresh
// token itself) and must never get an access-token header attached, nor be
// retried through the refresh-on-401 flow below -- a 401 from /login *is*
// the answer, not a signal to refresh and retry.
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

function isAuthEndpoint(url?: string): boolean {
  return AUTH_ENDPOINTS.some((path) => url?.includes(path));
}

apiClient.interceptors.request.use((config) => {
  if (!isAuthEndpoint(config.url)) {
    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Multiple requests can 401 around the same moment (e.g. a page that fires
// several API calls on load right as the access token expires). Without
// this, each would kick off its own refresh call, and thanks to backend
// rotation only the first would succeed -- the rest would revoke each
// other's brand-new tokens. Sharing one in-flight promise avoids that.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<RefreshResponse>(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken,
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const shouldAttemptRefresh =
      error.response?.status === 401 && original && !original._retried && !isAuthEndpoint(original.url);

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    original._retried = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      original.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(original);
    }

    // Refresh token is gone or invalid too -- there's no session to recover.
    window.location.assign('/login');
    return Promise.reject(error);
  },
);
