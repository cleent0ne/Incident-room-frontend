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
              <span className="pill-counter-badge">WELCOME BACK</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Back in the <span className="text-[#A3E635]">Incident Room</span>.
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                Pick up where you left off — live topologies, real telemetry, and a scoreboard that remembers every incident you&apos;ve closed out.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconHistory size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Pick up your streak</div>
                  <div className="text-xs text-neutral-400">Your daily streak and run history are tied to your account.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconClock size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Resume in-progress runs</div>
                  <div className="text-xs text-neutral-400">Come back to a scenario mid-incident, right where you left it.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0A0A0A] border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635] shrink-0">
                  <IconShield size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Cookie-based sessions</div>
                  <div className="text-xs text-neutral-400">No tracking, no analytics — just an auth cookie.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-500 pt-4 border-t border-neutral-800">
            Secure, encrypted authentication session
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 bg-[#121214] border border-neutral-800 rounded-2xl p-8 sm:p-10 flex flex-col justify-center space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Log in</h2>
            <p className="text-sm text-neutral-400">Welcome back — enter your details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-mono text-neutral-300 font-medium uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#A3E635] hover:underline font-mono">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <IconLock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#A3E635] focus:ring-1 focus:ring-[#A3E635] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                {formError}
              </div>
            )}

            <button
              className="btn-primary-lime w-full justify-center py-3 text-sm font-bold"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Logging in…' : 'Log in →'}
            </button>
          </form>

          <div className="pt-2">
            <OAuthButtons />
          </div>

          <p className="text-center text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800">
            No account yet?{' '}
            <Link href="/register" className="text-[#A3E635] font-bold hover:underline">
              Register free
            </Link>
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
