'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconFlame, IconClock, IconXMark, IconBolt } from '@/components/ui/icons';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { ScenarioCard } from '@/components/scenario/scenario-card';
import { DifficultyBadge } from '@/components/scenario/difficulty-badge';
import { HeroPreview } from '@/components/home/hero-preview';
import type { Page, ScenarioDetailDto, ScenarioSummaryDto } from '@/lib/types';

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const dailyResult = useApiGet<ScenarioDetailDto>('/api/v1/scenarios/daily');
  const scenariosResult = useApiGet<Page<ScenarioSummaryDto>>('/api/v1/scenarios?page=0&size=6');

  return (
    <main className="shell page">

      {/* ── HERO (CLEAR PURPOSE) ── */}
      <div className="home-hero">
        <div>
          <h1 className="home-hero-title">
            Practice real-world incident response in your browser.
          </h1>

          <p className="home-hero-lead">
            Incident Room is an interactive learning platform where developers and engineers simulate real production
            outages. Investigate logs, analyze system behavior, identify root causes, and apply fixes under time pressure.
          </p>

          <div className="home-hero-actions">
            <Link className="home-hero-btn-primary" href="/scenarios">
              Browse Incident Scenarios →
            </Link>

            <Link className="button outline" href="/play?daily=true">
              <IconFlame size={14} /> Daily Challenge (~10 min)
            </Link>
          </div>

          {/* Static explanation (important for Google) */}
          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--dim)' }}>
            Runs entirely in your browser. No installation required. Built for learning and practicing incident response.
          </div>
        </div>

        <div className="hero-right">
          <HeroPreview />
        </div>
      </div>


      {/* ── WHAT THIS APP IS ── */}
      <div className="section" style={{ textAlign: 'center', maxWidth: 900, marginInline: 'auto' }}>
        <h2>What is Incident Room?</h2>

        <p style={{ color: 'var(--dim)', lineHeight: 1.7 }}>
          Incident Room is a training platform that helps developers, DevOps engineers, and students learn how to respond
          to real-world system failures. Instead of reading theory, users are placed inside simulated incidents where they
          diagnose problems, investigate logs, and fix issues step by step.
        </p>

        <p style={{ color: 'var(--dim)', lineHeight: 1.7, marginTop: 12 }}>
          Each scenario mimics real production environments, including microservices, telemetry data, and cascading
          failures. The goal is to build practical debugging and on-call skills through hands-on experience.
        </p>
      </div>


      {/* ── HOW IT WORKS ── */}
      <div className="section">
        <div className="section-heading">
          <h2>How it works</h2>
        </div>

        <div className="home-workflow-grid">
          <div className="home-workflow-card">
            <h3>1. Investigate</h3>
            <p>Analyze logs, metrics, and traces to understand the issue.</p>
          </div>

          <div className="home-workflow-card">
            <h3>2. Identify</h3>
            <p>Form a hypothesis about the root cause.</p>
          </div>

          <div className="home-workflow-card">
            <h3>3. Fix</h3>
            <p>Apply the correct remediation.</p>
          </div>

          <div className="home-workflow-card">
            <h3>4. Learn</h3>
            <p>Review a postmortem and improve your approach.</p>
          </div>
        </div>
      </div>


      {/* ── DAILY INCIDENT (SAFE RENDER) ── */}
      <div className="section">
        <div className="section-heading">
          <h2>Today’s Featured Incident</h2>
        </div>

        <AsyncBoundary state={dailyResult}>
          {(daily) => (
            <div className="home-daily-card">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <DifficultyBadge difficulty={daily.difficulty} />
                <span className="tag">#{daily.rootCauseClass}</span>
              </div>

              <h3 style={{ marginTop: 10 }}>{daily.title}</h3>

              <p style={{ color: 'var(--dim)' }}>
                {daily.symptomSummary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span className="mono">
                  <IconClock size={12} /> {Math.round(daily.durationTargetSeconds / 60)} min
                </span>

                <Link className="button primary" href={`/play?scenario=${daily.slug}`}>
                  Start →
                </Link>
              </div>
            </div>
          )}
        </AsyncBoundary>
      </div>


      {/* ── FEATURED SCENARIOS ── */}
      <div className="section">
        <div className="section-heading">
          <h2>Featured Incident Scenarios</h2>
        </div>

        <AsyncBoundary state={scenariosResult}>
          {(data) => (
            <div className="grid">
              {data.content.map((scenario) => (
                <ScenarioCard key={scenario.slug} scenario={scenario} />
              ))}
            </div>
          )}
        </AsyncBoundary>
      </div>


      {/* ── WHO IT’S FOR ── */}
      <div className="section" style={{ textAlign: 'center', maxWidth: 900, marginInline: 'auto' }}>
        <h2>Who this is for</h2>

        <p style={{ color: 'var(--dim)', lineHeight: 1.7 }}>
          Built for software engineers, DevOps engineers, SREs, and students who want to improve debugging and incident
          response skills. Especially useful for preparing for real on-call responsibilities.
        </p>
      </div>


      {/* ── CTA ── */}
      <div className="home-cta-banner">
        <h2>Start practicing incident response</h2>

        <p className="lead">
          Jump into a simulation and learn by doing.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <Link className="home-hero-btn-primary" href="/scenarios">
            Explore Scenarios →
          </Link>

          <Link className="button outline" href="/register">
            Create Free Account
          </Link>
        </div>
      </div>

    </main>
  );
}