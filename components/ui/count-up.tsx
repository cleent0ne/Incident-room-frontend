'use client';

import { useEffect, useState } from 'react';

/**
 * Animates from 0 (or `from`) up to `target` over `durationMs`, respecting
 * prefers-reduced-motion (jumps straight to `target`, no animation). Extracted from
 * the homepage hero preview's score-reveal mechanic — see the design guide's
 * recommendation to reuse it on the real result page rather than building a second,
 * separate implementation.
 */
export function CountUp({
  target,
  from = 0,
  durationMs = 700,
  delayMs = 0,
}: {
  target: number;
  from?: number;
  durationMs?: number;
  delayMs?: number;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    setValue(from);
    let frameId: number;
    let startTimeout: ReturnType<typeof setTimeout>;

    function animate() {
      const start = performance.now();
      function tick(now: number) {
        const progress = Math.min(1, (now - start) / durationMs);
        setValue(Math.round(from + (target - from) * progress));
        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        }
      }
      frameId = requestAnimationFrame(tick);
    }

    startTimeout = setTimeout(animate, delayMs);
    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(frameId);
    };
  }, [target, from, durationMs, delayMs]);

  return <>{value}</>;
}
