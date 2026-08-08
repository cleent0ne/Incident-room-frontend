'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ResultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Result page error:', error);
    }
  }, [error]);

  return (
    <main className="shell page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div className="eyebrow">Debrief Error</div>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Unable to display debrief</h1>
      <p className="lead" style={{ margin: '0 auto 24px', maxWidth: 480 }}>
        Could not load the incident debrief results.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={() => reset()} className="button primary">
          Try again
        </button>
        <Link href="/profile" className="button secondary">
          Go to profile
        </Link>
      </div>
    </main>
  );
}
