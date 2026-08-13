'use client';

import Link from 'next/link';
import {
  IconFlame,
  IconClock,
  IconArrowRight,
} from '@/components/ui/icons';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { ScenarioCard } from '@/components/scenario/scenario-card';
import { DifficultyBadge } from '@/components/scenario/difficulty-badge';
import { HeroPreview } from '@/components/home/hero-preview';
import type { Page, ScenarioDetailDto, ScenarioSummaryDto } from '@/lib/types';

export default function HomePage() {
  const dailyResult = useApiGet<ScenarioDetailDto>('/api/v1/scenarios/daily');
  const scenariosResult = useApiGet<Page<ScenarioSummaryDto>>('/api/v1/scenarios?page=0&size=6');

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white bg-dot-pattern">
      <div className="shell page space-y-24 py-12">

        {/* ── 1. HERO BLOCK ── */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8 pb-12 border-b border-neutral-800/80">
          <div className="lg:col-span-7 space-y-6">

            {/* Section Counter Badge */}

            {/* High-Contrast Conversion Heading */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              Practice real-world <span className="text-[#A3E635]">incident response</span> in your browser.
            </h1>

            {/* Subtext */}
            <p className="text-neutral-400 text-lg sm:text-xl leading-relaxed max-w-2xl font-normal">
              Incident Room is an interactive learning platform where developers and SREs simulate real production
              outages. Investigate live telemetry logs, analyze system behavior under pressure, and apply fixes before SLAs breach.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link className="btn-primary-lime text-base font-bold" href="/scenarios">
                <span>Browse Incident Scenarios</span>
                <IconArrowRight size={18} />
              </Link>

              <Link
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-neutral-700 bg-[#121214] text-neutral-300 text-sm font-semibold hover:border-[#A3E635] hover:text-white transition-all shadow-sm"
                href="/play?daily=true"
              >
                <IconFlame size={16} className="text-[#A3E635]" />
                <span>Daily Challenge (~10 min)</span>
              </Link>
            </div>

            {/* Micro-copy badge */}
            <div className="pt-2 flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              "O_O"
            </div>
          </div>

          {/* Right Hero Demo */}
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 rounded-2xl p-1 bg-gradient-to-b from-neutral-800 to-neutral-900 shadow-2xl border border-neutral-800">
              <HeroPreview />
            </div>
          </div>
        </section>


        {/* ── 2. HOW IT WORKS WORKFLOW ── */}
        <section className="relative space-y-8">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              How the <span className="text-[#A3E635]">simulation works</span>
            </h2>
            <div className="accent-header-line" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01/04',
                ghost: '01',
                title: '1. Investigate',
                desc: 'Analyze live telemetry logs, metrics, and distributed traces to detect anomalies.',
              },
              {
                step: '02/04',
                ghost: '02',
                title: '2. Identify',
                desc: 'Formulate hypotheses and isolate the exact root-cause microservice failure.',
              },
              {
                step: '03/04',
                ghost: '03',
                title: '3. Fix',
                desc: 'Select and execute the optimal remediation strategy before SLAs are breached.',
              },
              {
                step: '04/04',
                ghost: '04',
                title: '4. Learn',
                desc: 'Review structured postmortems, diagnostic scores, and timing analytics.',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="relative bg-[#121214] border border-neutral-800 rounded-xl p-6 space-y-4 hover:border-[#A3E635]/50 transition-all shadow-md overflow-hidden group"
              >
                <div className="ghost-watermark">{card.ghost}</div>
                <span className="pill-counter-badge">{card.step}</span>
                <h3 className="text-lg font-bold text-white group-hover:text-[#A3E635] transition-colors">
                  {card.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* ── 3. TODAY'S FEATURED INCIDENT SPOTLIGHT ── */}
        <section className="relative space-y-8">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Today’s <span className="text-[#A3E635]">Outage Challenge</span>
            </h2>
            <div className="accent-header-line" />
          </div>

          <AsyncBoundary state={dailyResult}>
            {(daily) => (
              <div className="relative bg-[#121214] border border-[#A3E635]/40 rounded-2xl p-8 space-y-6 shadow-[0_0_30px_rgba(163,230,53,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <DifficultyBadge difficulty={daily.difficulty} />
                    <span className="text-xs font-mono bg-neutral-800 text-[#A3E635] px-3 py-1 rounded-full border border-neutral-700">
                      #{daily.rootCauseClass}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                    <IconClock size={14} className="text-[#A3E635]" /> Target: {Math.round(daily.durationTargetSeconds / 60)} min
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">{daily.title}</h3>
                  <p className="text-neutral-300 text-base leading-relaxed max-w-3xl">
                    {daily.symptomSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-neutral-500 font-mono">
                    Updated daily · Timed diagnostic scoring
                  </span>
                  <Link className="btn-primary-lime font-bold text-sm" href={`/play?scenario=${daily.slug}`}>
                    <span>Start Outage Simulation</span>
                    <IconArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </AsyncBoundary>
        </section>


        {/* ── 4. FEATURED INCIDENT SCENARIOS CATALOG ── */}
        <section className="relative space-y-8">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Explore <span className="text-[#A3E635]">Production Scenarios</span>
            </h2>
            <div className="accent-header-line" />
            <p className="text-neutral-400 text-base">
              Select an incident below to jump straight into active log analysis and root-cause isolation.
            </p>
          </div>

          <AsyncBoundary state={scenariosResult}>
            {(data) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.content.map((scenario) => (
                  <ScenarioCard key={scenario.slug} scenario={scenario} />
                ))}
              </div>
            )}
          </AsyncBoundary>
        </section>


        {/* ── 7. FOOTER CONVERSION CTA BANNER ── */}
        <section className="relative bg-[#121214] border border-[#A3E635]/40 rounded-2xl p-10 sm:p-14 text-center space-y-6 shadow-[0_0_35px_rgba(163,230,53,0.15)] overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to master <span className="text-[#A3E635]">on-call incident response?</span>
            </h2>
            <p className="text-neutral-300 text-base sm:text-lg">
              Jump into a live simulation right now. Build real debugging skills and eliminate on-call anxiety.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link className="btn-primary-lime text-base font-bold py-3.5 px-8" href="/scenarios">
              <span>Explore Scenarios Now</span>
              <IconArrowRight size={18} />
            </Link>

            <Link
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-neutral-700 bg-[#0A0A0A] text-white text-base font-semibold hover:border-[#A3E635] hover:text-[#A3E635] transition-all"
              href="/register"
            >
              Create Free Account
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}