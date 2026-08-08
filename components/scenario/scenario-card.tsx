import Link from 'next/link';
import type { ScenarioSummaryDto } from '@/lib/types';
import { DifficultyBadge } from './difficulty-badge';

export function ScenarioCard({ scenario }: { scenario: ScenarioSummaryDto }) {
  return (
    <Link className="scenario-card" href={`/scenarios/${scenario.slug}`}>
      {/* Left accent bar colored by difficulty */}
      <span
        className="scenario-card__accent"
        data-difficulty={scenario.difficulty}
        aria-hidden="true"
      />

      <div className="scenario-card__top">
        <DifficultyBadge difficulty={scenario.difficulty} />
        <span className="scenario-card__cause mono">#{scenario.rootCauseClass}</span>
      </div>

      <h3 className="scenario-card__title">{scenario.title}</h3>
      <p className="scenario-card__summary">{scenario.symptomSummary}</p>

      <div className="scenario-card__footer">
        <span className="scenario-card__cta">Investigate →</span>
      </div>
    </Link>
  );
}
