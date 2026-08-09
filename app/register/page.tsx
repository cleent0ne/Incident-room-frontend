'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { post, ApiError } from '@/lib/api';
import { fieldErrorMap } from '@/lib/form-errors';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { IconBolt, IconFlame, IconMail, IconLock, IconUser, IconRadio } from '@/components/ui/icons';

/**
 * Register always returns `202` regardless of what actually happened server-side
 * (anti-enumeration): a brand-new email sends a verification code, an existing
 * *verified* account silently no-ops (no email, no error), and an existing
 * *unverified* account gets its password/display name updated and a fresh code sent
 * — all three look identical from here. So the success copy below is deliberately
 * generic ("check your email if it needs verifying") rather than "we sent a code" —
 * that would be a lie in the already-verified case.
 */
export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await post('/api/v1/auth/register', { email, password, displayName });
      // Bypassing email verification: auto-login immediately after register
      try {
        await post('/api/v1/auth/login', { email, password });
        router.push('/');
        router.refresh();
      } catch {
        router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.is('CONFLICT') || err.status === 409)) {
        setFormError('An account with this email already exists. Please log in instead.');
      } else if (err instanceof ApiError && err.is('VALIDATION_FAILED')) {
        setFieldErrors(fieldErrorMap(err.fieldErrors));
        setFormError(null);
      } else if (err instanceof ApiError && err.is('RATE_LIMITED')) {
        setFormError('Too many attempts — slow down and try again in a moment.');
      } else if (err instanceof ApiError && err.status === 400) {
        setFormError(err.message || 'Some of those fields look invalid.');
      } else {
        setFormError('Could not create an account. Try again.');
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

          <h1>Learn incident response by running the room.</h1>
          <p className="auth-shell-lead">
            Create a free account to track your streak, save your run history, and climb the
            leaderboard on every scenario you play.
          </p>

          <div className="auth-shell-features">
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconRadio size={12} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Real incidents, safely broken</div>
                <div className="auth-shell-feature-desc">Live telemetry and topology views for scenarios modeled on real outages.</div>
              </div>
            </div>
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconFlame size={16} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Build a streak</div>
                <div className="auth-shell-feature-desc">A new daily challenge keeps your incident-response reflexes sharp.</div>
              </div>
            </div>
            <div className="auth-shell-feature">
              <span className="auth-shell-feature-icon">
                <IconUser size={16} />
              </span>
              <div>
                <div className="auth-shell-feature-title">Free, no credit card</div>
                <div className="auth-shell-feature-desc">Just an email and a password — or sign in with Google or GitHub.</div>
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

          <h1>Create an account</h1>
          <p className="auth-card-lead">Start your first incident in under a minute.</p>

          <form onSubmit={handleSubmit} noValidate style={{ marginTop: 22 }}>
            <div className="auth-field">
              <label htmlFor="displayName">Display name</label>
              <div className="auth-input-wrap">
                <IconUser size={16} />
                <input
                  id="displayName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="nickname"
                  placeholder="How you'll appear on the leaderboard"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              {fieldErrors.displayName && <div className="field-error">{fieldErrors.displayName}</div>}
            </div>

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
              {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <IconLock size={16} />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {fieldErrors.password ? (
                <div className="field-error">{fieldErrors.password}</div>
              ) : (
                <div className="auth-hint">At least 10 characters.</div>
              )}
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <OAuthButtons />

          <p className="auth-card-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
