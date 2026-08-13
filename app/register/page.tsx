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
 * — all three look identical from here. So this always routes to /verify-email with
 * the same generic "check your email if it needs verifying" framing (via
 * justRegistered=true), rather than claiming "we sent a code" — that would be a lie
 * in the already-verified case.
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
      // Registration always leaves the account unverified (see AuthService.register /
      // login's EMAIL_NOT_VERIFIED enforcement), so attempting an immediate login here
      // would just 403 on every normal signup — go straight to the code-entry step
      // instead of round-tripping through /login first.
      router.push(`/verify-email?email=${encodeURIComponent(email)}&justRegistered=true`);
    } catch (err) {
      if (err instanceof ApiError && (err.is('CONFLICT') || err.status === 409)) {
        // CONFLICT covers two distinct backend cases with the same code (email taken vs
        // display name taken) — only `message` differs between them, so use it directly
        // rather than a single hardcoded string that was only ever accurate for the
        // email case.
        setFormError(err.message || 'An account with this email already exists. Please log in instead.');
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
    <main className="min-h-screen bg-[#0A0A0A] text-white bg-dot-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Info Panel */}
        <div className="lg:col-span-6 bg-[#121214] border border-neutral-800 rounded-2xl p-8 sm:p-10 flex flex-col justify-between space-y-8 shadow-xl">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-white">
              <span className="p-1.5 rounded-lg bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/30">
                <IconBolt size={18} />
              </span>
              <span>
                Incident<b className="text-[#A3E635]">Room</b>
              </span>
            </Link>

            <div className="space-y-2">
              <span className="pill-counter-badge">JOIN THE PLATFORM</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Learn incident response by <span className="text-[#A3E635]">running the room</span>.
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                Create a free account to track your streak, save your run history, and climb the leaderboard on every scenario you play.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconRadio size={14} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Real incidents, safely broken</div>
                  <div className="text-xs text-neutral-400">Live telemetry and topology views for scenarios modeled on real outages.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconFlame size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Build a streak</div>
                  <div className="text-xs text-neutral-400">A new daily challenge keeps your incident-response reflexes sharp.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconUser size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Free, no credit card required</div>
                  <div className="text-xs text-neutral-400">Just an email and password — or sign in instantly with Google or GitHub.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-500 pt-4 border-t border-neutral-800">
            Instant setup · No installation required
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 bg-[#121214] border border-neutral-800 rounded-2xl p-8 sm:p-10 flex flex-col justify-center space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Create an account</h2>
            <p className="text-sm text-neutral-400">Start your first incident in under a minute.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="block text-xs font-mono text-neutral-300 font-medium uppercase tracking-wider">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <IconUser size={16} />
                </div>
                <input
                  id="displayName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="nickname"
                  placeholder="How you'll appear on leaderboards"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              {fieldErrors.displayName && <div className="text-xs text-red-400 font-mono mt-1">{fieldErrors.displayName}</div>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-mono text-neutral-300 font-medium uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <IconMail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {fieldErrors.email && <div className="text-xs text-red-400 font-mono mt-1">{fieldErrors.email}</div>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-mono text-neutral-300 font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <IconLock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {fieldErrors.password ? (
                <div className="text-xs text-red-400 font-mono mt-1">{fieldErrors.password}</div>
              ) : (
                <div className="text-xs text-neutral-500 font-mono mt-1">Must be at least 10 characters.</div>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                {formError}
              </div>
            )}

            <button
              className="btn-primary-lime w-full justify-center py-3 text-sm font-bold mt-2"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Create Free Account →'}
            </button>
          </form>

          <div className="pt-1">
            <OAuthButtons />
          </div>

          <p className="text-center text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800">
            Already have an account?{' '}
            <Link href="/login" className="text-[#A3E635] font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}