import Link from 'next/link';
import type { ScenarioDetailDto } from '@/lib/types';
import { DifficultyBadge } from './difficulty-badge';
import { Topology } from './topology';
import { IconArrowRight, IconClock, IconBolt, IconFlame } from '@/components/ui/icons';

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
    <main className="min-h-screen bg-[#0A0A0A] text-white bg-dot-pattern">
      <div className="shell page space-y-8 py-10">

        {/* Back Link */}
        <Link
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-[#A3E635] transition-colors"
          href="/scenarios"
        >
          ← Back to incident catalog
        </Link>

        {daily && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#121214] border border-[#A3E635]/30">
            <span className="text-xs font-mono text-neutral-300">
              Today —{' '}
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-[#A3E635] font-bold">
              <IconFlame size={14} /> Keep your streak
            </span>
          </div>
        )}

        {/* Title & Tags */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={scenario.difficulty} />
            <span className="text-xs font-mono bg-[#121214] text-[#A3E635] px-3 py-1 rounded-full border border-neutral-800">
              #{scenario.rootCauseClass}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {scenario.title}
          </h1>
          <div className="accent-header-line" />
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Briefing Panel */}
          <section className="lg:col-span-7 bg-[#121214] border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-xl">
            <span className="pill-counter-badge">
              INCIDENT BRIEFING
            </span>

            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed border-b border-neutral-800 pb-6">
              {scenario.symptomSummary}
            </p>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-neutral-800/80">
                <span className="text-neutral-400 flex items-center gap-2">
                  <IconClock size={15} className="text-[#A3E635]" /> Estimated time
                </span>
                <span className="text-white font-bold">~{estimatedMinutes} min</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-neutral-800/80">
                <span className="text-neutral-400 flex items-center gap-2">
                  <IconBolt size={15} className="text-[#A3E635]" /> Investigation tools
                </span>
                <span className="text-white font-bold">{investigationCount} actions</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-neutral-800/80">
                <span className="text-neutral-400 flex items-center gap-2">
                  <span className="text-[#A3E635] font-bold">✓</span> Remediation paths
                </span>
                <span className="text-white font-bold">{remediationCount} choices</span>
              </div>
            </div>

            <div className="pt-2">
              <Link className="btn-primary-lime text-base font-bold w-full justify-center py-3.5" href={startHref}>
                <span>Start Outage Simulation</span>
                <IconArrowRight size={18} />
              </Link>
            </div>
          </section>

          {/* Topology Panel */}
          <section className="lg:col-span-5 space-y-4">
            <div className="bg-[#121214] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <span className="pill-counter-badge">
                SYSTEMS INVOLVED
              </span>
              <Topology topology={scenario.topology} />
            </div>

            <Link
              className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-[#A3E635] transition-colors p-2"
              href={`/scenarios/${scenario.slug}/leaderboard`}
            >
              View incident leaderboard →
            </Link>
          </section>

        </div>

      </div>
    </main>
  );
}

