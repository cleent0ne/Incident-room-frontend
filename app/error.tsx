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
    <main className="error-page-shell">
      <div className="error-card">
        <div className="error-header-icon">
          <div className="error-icon-glow" />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div className="error-badge">
          <span className="error-status-dot" />
          500 System Error
        </div>

        <h1>Something Went Wrong</h1>

        <p className="error-description">
          An unexpected error occurred on the server. The telemetry log has recorded this event.
        </p>

        {error.digest && (
          <div className="error-correlation">
            <span className="error-correlation-label">Digest:</span>
            <code>{error.digest}</code>
          </div>
        )}

        <div className="error-actions">
          <button onClick={() => reset()} className="button primary" type="button">
            Try again
          </button>
          <Link href="/" className="button outline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
