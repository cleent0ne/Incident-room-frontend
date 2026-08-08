'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Profile page error:', error);
    }
  }, [error]);

  return (
    <main className="shell page" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div className="eyebrow">Profile Error</div>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Could not load profile</h1>
      <p className="lead" style={{ margin: '0 auto 24px', maxWidth: 480 }}>
        There was a problem fetching your profile history. Try refreshing the page.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={() => reset()} className="button primary">
          Retry
        </button>
        <Link href="/" className="button secondary">
          Home
        </Link>
      </div>
    </main>
  );
}
