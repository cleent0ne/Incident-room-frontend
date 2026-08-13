import Link from 'next/link';
import type { ScenarioSummaryDto } from '@/lib/types';
import { DifficultyBadge } from './difficulty-badge';
import { IconArrowRight } from '@/components/ui/icons';

export function ScenarioCard({ scenario }: { scenario: ScenarioSummaryDto }) {
  return (
    <Link
      className="group relative flex flex-col justify-between bg-[#121214] border border-neutral-800 rounded-xl p-6 hover:border-[#A3E635]/60 hover:shadow-[0_0_25px_rgba(163,230,53,0.18)] transition-all duration-300 overflow-hidden"
      href={`/scenarios/${scenario.slug}`}
    >
      {/* Top difficulty & cause tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DifficultyBadge difficulty={scenario.difficulty} />
          <span className="text-xs font-mono bg-neutral-900 text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-800 font-medium">
            #{scenario.rootCauseClass}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-[#A3E635] transition-colors leading-snug">
          {scenario.title}
        </h3>

        <p className="text-neutral-400 text-sm leading-relaxed line-clamp-3">
          {scenario.symptomSummary}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
        <span className="text-xs font-mono text-neutral-500">Timed Simulation</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#A3E635] group-hover:translate-x-1 transition-transform">
          <span>Investigate</span>
          <IconArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

