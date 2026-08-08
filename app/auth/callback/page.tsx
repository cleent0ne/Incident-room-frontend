'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Landing page for a successful OAuth2 login. The backend's OAuth2AuthenticationSuccessHandler
 * redirects here — via `response.sendRedirect(frontendBaseUrl + "/auth/callback")` — immediately
 * after setting the same session cookies a password login would get. No token, user id, or any
 * other data is ever passed in this URL by design (the cookie is already set on the response by
 * the time the redirect happens) — this page's only job is to confirm the session actually took
 * (via the same `GET /auth/me` the rest of the app already uses) and route on from there.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (user === undefined) return; // still checking
    if (user) {
      router.replace('/profile');
    } else {
      // Shouldn't normally happen — a genuine OAuth failure is redirected straight to
      // /login?error=oauth_failed by the backend's failure handler, never through here. Landing
      // here with no session is an unexpected edge case (e.g. a cookie that didn't take), so
      // fail toward the same place with the same generic message rather than a dead end.
      router.replace('/login?error=oauth_failed');
    }
  }, [user, router]);

  return <main className="shell page empty mono">Signing you in…</main>;
}
