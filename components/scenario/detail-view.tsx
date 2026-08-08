import Link from 'next/link';
import type { ScenarioDetailDto } from '@/lib/types';
import { DifficultyBadge } from './difficulty-badge';
import { Topology } from './topology';

// CORRECTION: ScenarioDetailDto has no `briefing`/`investigationToolCount`/
// `remediationCount` fields in the real API. `symptomSummary` is the only
// descriptive copy the backend sends, so it's used as the briefing text; the tool
// and remediation counts are derived from `actions` (split by `kind`) instead of
// being read as separate fields.
export function ScenarioDetailView({
  scenario,
  daily = false,
}: {
  scenario: ScenarioDetailDto;
  daily?: boolean;
}) {
  const startHref = daily ? '/play?daily=true' : `/play?scenario=${scenario.slug}`;
  const investigationCount = scenario.actions.filter((a) => a.kind === 'INVESTIGATE').length;
  const remediationCount = scenario.actions.filter((a) => a.kind === 'REMEDIATE').length;
  const estimatedMinutes = Math.max(1, Math.round(scenario.durationTargetSeconds / 60));

  return (
    <main className="shell page detail">
      <Link className="text-btn" href="/scenarios">
        ← Back to catalog
      </Link>

      {daily && (
        <div className="title-row" style={{ marginTop: 28 }}>
          <span className="eyebrow">
            Today —{' '}
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="streak">♨ Keep your streak</span>
        </div>
      )}

      <div className="title-row" style={{ marginTop: 25 }}>
        <DifficultyBadge difficulty={scenario.difficulty} />
        <span className="tag">#{scenario.rootCauseClass}</span>
      </div>
      <h1 style={{ fontSize: 48 }}>{scenario.title}</h1>

      <div className="detail-grid">
        <section className="panel">
          <div className="section-label">Briefing</div>
          <p className="briefing">{scenario.symptomSummary}</p>
          <div className="fact-list">
            <div>
              Estimated time <span className="mono" style={{ float: 'right' }}>~{estimatedMinutes} min</span>
            </div>
            <div>
              Investigation tools{' '}
              <span className="mono" style={{ float: 'right' }}>{investigationCount}</span>
            </div>
            <div>
              Possible remediations{' '}
              <span className="mono" style={{ float: 'right' }}>{remediationCount}</span>
            </div>
          </div>
          <Link className="button primary" href={startHref}>
            Start incident
          </Link>
        </section>

        <section>
          <div className="panel">
            <div className="section-label">Systems involved</div>
            <Topology topology={scenario.topology} />
          </div>
          <Link
            className="text-btn"
            style={{ display: 'inline-block', marginTop: 14 }}
            href={`/scenarios/${scenario.slug}/leaderboard`}
          >
            View leaderboard →
          </Link>
        </section>
      </div>
    </main>
  );
}
