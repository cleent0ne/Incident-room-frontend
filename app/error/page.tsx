'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { IconBolt, IconShield, IconFlame } from '@/components/ui/icons';

export default function GenericErrorPage() {
  const searchParams = useSearchParams();
  const correlationId = searchParams.get('cid') || undefined;
  const status = searchParams.get('status') || '500';

  return (
    <main className="error-page-shell">
      <div className="error-card">
        <div className="error-header-icon">
          <div className="error-icon-glow" />
          <IconShield size={32} />
        </div>

        <div className="error-badge">
          <span className="error-status-dot" />
          {status} Server Error
        </div>

        <h1>System Outage / Unhandled Error</h1>

        <p className="error-description">
          An unexpected server error occurred that couldn&apos;t be resolved automatically.
          Don&apos;t worry — our system telemetry monitors all incidents.
        </p>

        {correlationId && (
          <div className="error-correlation">
            <span className="error-correlation-label">Correlation ID:</span>
            <code>{correlationId}</code>
          </div>
        )}

        <div className="error-actions">
          <button
            type="button"
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Retry request
          </button>
          <Link href="/" className="button outline">
            Back to Safety
          </Link>
        </div>

        <div className="error-footer-brand">
          <IconBolt size={14} />
          <span>Incident<b>Room</b> Command Center</span>
        </div>
      </div>
    </main>
  );
}
