'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { get, post, ApiError } from '@/lib/api';
import { saveCapabilityToken } from '@/lib/anon-tokens';
import type { AttemptStateResponse, ScenarioDetailDto } from '@/lib/types';

/**
 * `/play` is a thin starter, not the play screen itself. It exists because starting
 * an attempt is a POST (side-effecting — shouldn't happen on every render/back-nav),
 * while the actual play screen at `/play/[id]` needs to be re-enterable on reload
 * without creating a fresh attempt each time. So: resolve which scenario slug to
 * start (`?scenario=slug` directly, or `?daily=true` via a lookup first), POST once,
 * then replace the URL to `/play/{attemptId}` where the real screen hydrates via
 * `GET /attempts/{id}`.
 */
function PlayStarter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      const scenarioParam = searchParams.get('scenario') ?? searchParams.get('slug');
      const isDaily = searchParams.get('daily') === 'true';

      try {
        let scenarioSlug = scenarioParam;
        if (!scenarioSlug && isDaily) {
          const daily = await get<ScenarioDetailDto>('/api/v1/scenarios/daily');
          scenarioSlug = daily.slug;
        }
        if (!scenarioSlug) {
          setError('No incident was specified to start.');
          return;
        }

        const attempt = await post<AttemptStateResponse>('/api/v1/attempts', { scenarioSlug });

        if (attempt.capabilityToken) {
          saveCapabilityToken({
            attemptId: attempt.attemptId,
            scenarioSlug: attempt.scenarioSlug,
            scenarioTitle: attempt.scenarioTitle,
            token: attempt.capabilityToken,
          });
        }

        router.replace(`/play/${attempt.attemptId}`);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[PlayStarter] Failed to start incident attempt:', err);
        }
        if (err instanceof ApiError && (err.is('NOT_FOUND') || err.status === 404)) {
          setError("That incident isn't available right now or has not been published.");
        } else if (err instanceof ApiError && (err.is('RATE_LIMITED') || err.status === 429)) {
          setError('Too many attempts started — slow down and try again in a moment.');
        } else if (err instanceof ApiError && (err.is('FORBIDDEN') || err.status === 403)) {
          setError('Access forbidden (403). Please log in or refresh your session and try again.');
        } else if (err instanceof ApiError && err.message) {
          setError(err.message);
        } else {
          setError('Could not start this incident. Try again.');
        }
      }
    }

    void run();
    // searchParams is read fresh inside run() on every mount of this effect (guarded
    // by startedRef so it only actually runs once) — nothing else it reads changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="shell page" style={{ textAlign: 'center' }}>
        <div className="empty">{error}</div>
      </main>
    );
  }

  return <main className="shell page empty mono">Starting incident…</main>;
}

export default function PlayStartPage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Starting incident…</main>}>
      <PlayStarter />
    </Suspense>
  );
}
