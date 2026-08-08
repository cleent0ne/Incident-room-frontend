'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unhandled app error:', error);
    }
  }, [error]);

  return (
    <main className="shell page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div className="eyebrow">Error</div>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Something went wrong</h1>
      <p className="lead" style={{ margin: '0 auto 24px', maxWidth: 480 }}>
        An unexpected error occurred. You can try restoring your session or returning home.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={() => reset()} className="button primary">
          Try again
        </button>
        <Link href="/" className="button secondary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
