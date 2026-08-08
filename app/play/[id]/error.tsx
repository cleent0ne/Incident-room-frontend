'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Play session error:', error);
    }
  }, [error]);

  return (
    <main className="shell page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div className="eyebrow">Play Error</div>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Incident room session error</h1>
      <p className="lead" style={{ margin: '0 auto 24px', maxWidth: 480 }}>
        Could not load or restore this incident session. Your attempt progress is saved automatically when possible.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={() => reset()} className="button primary">
          Try reloading session
        </button>
        <Link href="/scenarios" className="button secondary">
          Back to catalog
        </Link>
      </div>
    </main>
  );
}
