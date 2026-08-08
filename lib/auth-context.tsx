'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from './api';
import { get, post } from './api';

/**
 * Matches `UserResponse` in the real OpenAPI doc exactly:
 * `{ id, email, displayName, emailVerified, role, currentStreak, oauthProvider }`.
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: 'USER' | 'ADMIN';
  currentStreak: number;
  /** null for password accounts; "google" or "github" for OAuth-linked accounts. */
  oauthProvider: string | null;
  /** ISO-8601 timestamp of account creation — null for accounts pre-dating this field. */
  createdAt: string | null;
}

interface AuthContextValue {
  /** undefined = still checking on first load, null = confirmed anonymous */
  user: AuthUser | null | undefined;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const me = await get<AuthUser>('/api/v1/auth/me');
      setUser(me);
    } catch (err) {
      // GET /auth/me returning 401 UNAUTHENTICATED means "not logged in" — this is
      // the expected anonymous state, not an error condition. Any other status
      // (network failure, 5xx) is left as "still unknown" rather than confidently
      // anonymous, so the UI doesn't flash a logged-out header on a transient blip.
      if (err instanceof ApiError && (err.status === 401 || err.is('UNAUTHENTICATED') || err.is('INVALID_CREDENTIALS'))) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    // 204 No Content on success. The backend clears auth cookies itself on logout
    // (same as it does on a failed refresh) — the frontend only needs to drop the
    // in-memory user, not separately clear cookies it can't read anyway (HttpOnly).
    //
    // Deliberately swallow errors here rather than rethrowing: this call can fail for
    // reasons that don't mean the user failed to log out from their perspective (the
    // access token already expired, the ir_csrf cookie is stale/missing so the
    // backend's CSRF check 403s, a network blip). None of those should crash whatever
    // called logout() — the local session is cleared either way, and callers like the
    // header's "Log out" button aren't expecting to handle a thrown error.
    try {
      await post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout request failed (local session cleared anyway):', err);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, refresh, setUser, logout }), [user, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
