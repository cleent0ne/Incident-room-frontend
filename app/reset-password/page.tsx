'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { post, ApiError } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await post('/api/v1/auth/reset-password', {
        email,
        token: token.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.is('INVALID_CREDENTIALS')) {
        setFormError('Invalid or expired reset code. Please check the code or request a new one.');
      } else if (err instanceof ApiError && err.is('RATE_LIMITED')) {
        setFormError('Too many attempts — slow down and try again in a moment.');
      } else {
        setFormError('Could not reset password. Please try again.');
      }
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="shell page">
        <div className="auth panel">
          <h1>Password reset!</h1>
          <p className="lead" style={{ fontSize: 14, marginBottom: 20 }}>
            Your password has been successfully reset. All active sessions have been signed out for security.
          </p>
          <button
            className="button primary"
            onClick={() => router.push('/login')}
            id="proceed-to-login-btn"
          >
            Log in with new password
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell page">
      <div className="auth panel">
        <h1>Set new password</h1>
        <p className="lead" style={{ fontSize: 14, marginBottom: 20 }}>
          Enter the 6-digit code sent to your email along with your new password.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="token">6-digit reset code</label>
          <input
            id="token"
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            className="mono"
            style={{ letterSpacing: 2 }}
          />

          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {formError && <div className="form-error">{formError}</div>}

          <button className="button primary" type="submit" disabled={submitting} id="reset-password-btn">
            {submitting ? 'Resetting password…' : 'Reset password'}
          </button>
        </form>

        <p className="lead" style={{ marginTop: 20, fontSize: 14 }}>
          Didn&apos;t get a code? <Link href="/forgot-password">Request a new code</Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading…</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
