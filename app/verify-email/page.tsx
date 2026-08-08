'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { post, ApiError } from '@/lib/api';
import { fieldErrorMap } from '@/lib/form-errors';
import { useAuth, type AuthUser } from '@/lib/auth-context';

/**
 * `verify-email`'s error responses are documented in the OpenAPI doc as returning a
 * `UserResponse` body on 400/401 — that's almost certainly spec drift from the same
 * generation process that got the success status codes wrong elsewhere (see the plan's
 * meta-correction table). `lib/api.ts` parses every non-2xx response as the standard
 * `{ code, message, fieldErrors? }` envelope regardless of what the doc claims for that
 * status, which is the safer assumption here too.
 */
function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const justRegistered = searchParams.get('justRegistered') === 'true';

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await post<AuthUser>('/api/v1/auth/verify-email', { email, code });
      setUser(user);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.is('VALIDATION_FAILED')) {
        setFieldErrors(fieldErrorMap(err.fieldErrors));
      } else if (err instanceof ApiError && err.status === 401) {
        setFormError('That code is incorrect or has expired. Request a new one below.');
      } else {
        setFormError('Could not verify this code. Try again.');
      }
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResendNotice(null);
    setFormError(null);
    setResending(true);
    try {
      await post('/api/v1/auth/resend-verification', { email });
      setResendNotice('If this address needs verifying, a new code is on its way.');
    } catch (err) {
      if (err instanceof ApiError && err.is('RATE_LIMITED')) {
        setFormError('Too many resend attempts — slow down and try again in a moment.');
      } else if (err instanceof ApiError && err.is('VALIDATION_FAILED')) {
        setFieldErrors(fieldErrorMap(err.fieldErrors));
      } else {
        setFormError('Could not resend a code right now. Try again.');
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="shell page">
      <div className="auth panel">
        <h1>Verify your email</h1>
        {justRegistered && (
          <p className="lead" style={{ fontSize: 14, marginTop: 8 }}>
            Check your inbox for a 6-digit code if this address needs verifying.
          </p>
        )}
        <form onSubmit={handleVerify} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}

          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {fieldErrors.code && <div className="field-error">{fieldErrors.code}</div>}

          {formError && <div className="form-error">{formError}</div>}
          {resendNotice && (
            <div className="field-error" style={{ color: 'var(--good)' }}>
              {resendNotice}
            </div>
          )}

          <button className="button primary" type="submit" disabled={submitting || code.length !== 6}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <button
          className="button outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={handleResend}
          disabled={resending || !email}
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading…</main>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
