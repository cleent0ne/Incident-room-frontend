'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { post, ApiError } from '@/lib/api';
import { useAuth, type AuthUser } from '@/lib/auth-context';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { IconBolt, IconClock, IconHistory, IconMail, IconLock, IconShield } from '@/components/ui/icons';

/**
 * `401 INVALID_CREDENTIALS` on login covers three backend cases with identical
 * frontend-facing behavior — unknown email, wrong password, and an OAuth-only
 * account attempting a password login. All three are indistinguishable by design;
 * this deliberately does not try to guess which one happened.
 *
 * `403 EMAIL_NOT_VERIFIED` is only thrown *after* password verification succeeds, so
 * a wrong password on an unverified account correctly falls into the 401 branch above
 * ("incorrect email or password"), not this one — don't swap the check order.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Set by the backend's OAuth2AuthenticationFailureHandler redirecting back here — a
    // generic code, never the underlying exception detail (see that handler's own comment
    // on why). "That provider" rather than naming Google/GitHub specifically since this
    // page doesn't know which one was attempted.
    if (searchParams.get('error') === 'oauth_failed') {
      setFormError('Could not sign in with that provider. Try again, or use your email and password.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await post<AuthUser>('/api/v1/auth/login', { email, password });
      setUser(user);
      router.refresh();
      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      if (err instanceof ApiError && err.is('EMAIL_NOT_VERIFIED')) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      if (err instanceof ApiError && err.is('INVALID_CREDENTIALS')) {
        setFormError(err.message || 'Incorrect email or password.');
      } else if (err instanceof ApiError && err.is('RATE_LIMITED')) {
        setFormError('Too many attempts — slow down and try again in a moment.');
      } else {
        setFormError(err instanceof ApiError && err.message ? err.message : 'Could not log in. Try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell-side">
        <div className="auth-shell-side-content">
          <Link href="/" className="auth-shell-brand">
            <span className="nav-logo-mark">
              <IconBolt size={18} />
            </span>
            <span className="brand">
              Incident<b>Room</b>
            </span>
          </Link>

          <h1>Back in the room.</h1>
          <p className="auth-shell-lead">
            Pick up where you left off — live topologies, real telemetry, and a scoreboard that
            remembers every incident you&apos;ve closed out.
          </p>

          <div className="auth-shell-features">
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconHistory size={16} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Pick up your streak</div>
                <div className="auth-shell-feature-desc">Your daily streak and run history are tied to your account.</div>
              </div>
            </div>
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconClock size={16} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Resume in-progress runs</div>
                <div className="auth-shell-feature-desc">Come back to a scenario mid-incident, right where you left it.</div>
              </div>
            </div>
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconShield size={16} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Cookie-based sessions</div>
                <div className="auth-shell-feature-desc">No tracking, no analytics — just an auth cookie.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-shell-form-col">
        <div className="auth-card">
          <Link href="/" className="auth-card-mobile-brand">
            <span className="nav-logo-mark">
              <IconBolt size={16} />
            </span>
            <span className="brand">
              Incident<b>Room</b>
            </span>
          </Link>

          <h1>Log in</h1>
          <p className="auth-card-lead">Welcome back — enter your details to continue.</p>

          <form onSubmit={handleSubmit} noValidate style={{ marginTop: 22 }}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrap">
                <IconMail size={16} />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link href="/forgot-password" className="auth-field-inline-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap" style={{ marginTop: 7 }}>
                <IconLock size={16} />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <OAuthButtons />

          <p className="auth-card-footer">
            No account yet? <Link href="/register">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
