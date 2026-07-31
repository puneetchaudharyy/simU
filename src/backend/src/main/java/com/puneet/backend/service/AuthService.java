package com.puneet.backend.service;

import com.puneet.backend.dto.AuthResponse;
import com.puneet.backend.dto.LoginRequest;
import com.puneet.backend.dto.RegisterRequest;
import com.puneet.backend.entity.RefreshToken;
import com.puneet.backend.entity.User;
import com.puneet.backend.exception.EmailAlreadyExistsException;
import com.puneet.backend.exception.InvalidRefreshTokenException;
import com.puneet.backend.repository.RefreshTokenRepository;
import com.puneet.backend.repository.UserRepository;
import com.puneet.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        user = userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        // Delegates to CustomUserDetailsService + password check; throws
        // BadCredentialsException / DisabledException as appropriate.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        Claims claims;
        try {
            claims = jwtService.parseClaims(rawRefreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidRefreshTokenException("Refresh token is invalid or expired");
        }

        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new InvalidRefreshTokenException("Token is not a refresh token");
        }

        String tokenHash = hash(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token is invalid or expired"));

        if (!stored.isValid()) {
            throw new InvalidRefreshTokenException("Refresh token is invalid or expired");
        }

        // Rotate: revoke the used token and issue a brand new pair. This limits
        // the blast radius if a refresh token is ever stolen and replayed.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hash(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(stored -> {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
        });
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

        UUID jti = UUID.randomUUID();
        String rawRefreshToken = jwtService.generateRefreshToken(user.getId(), jti);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(rawRefreshToken))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        long expiresInSeconds = jwtService.getAccessTokenExpirationMs() / 1000;
        return AuthResponse.of(accessToken, rawRefreshToken, expiresInSeconds);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}