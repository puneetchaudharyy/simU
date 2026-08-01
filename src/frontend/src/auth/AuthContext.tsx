import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';
import type { UserResponse } from '../types/auth';

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  // Starts true so routes don't flash a login screen while we check for an
  // already-valid session on first load.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (getAccessToken()) {
        try {
          setUser(await authApi.getCurrentUser());
        } catch {
          clearTokens();
        }
      }
      setIsLoading(false);
    }
    void bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(await authApi.getCurrentUser());
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.register({ email, password });
    setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(await authApi.getCurrentUser());
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Token may already be expired/revoked -- that's fine, the end
        // state the user wants ("logged out") is what we set below either way.
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
