'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { post, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await post('/api/v1/auth/forgot-password', { email });
      // Redirect to reset-password page with email pre-filled
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError && err.is('RATE_LIMITED')) {
        setFormError('Too many attempts — slow down and try again in an hour.');
      } else {
        setFormError('Could not process request. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="shell page">
      <div className="auth panel">
        <h1>Reset password</h1>
        <p className="lead" style={{ fontSize: 14, marginBottom: 20 }}>
          Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
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
            placeholder="you@example.com"
          />

          {formError && <div className="form-error">{formError}</div>}

          <button className="button primary" type="submit" disabled={submitting} id="request-reset-btn">
            {submitting ? 'Sending code…' : 'Send reset code'}
          </button>
        </form>

        <p className="lead" style={{ marginTop: 20, fontSize: 14 }}>
          Remembered your password? <Link href="/login">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}
