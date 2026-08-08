import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HeroPreview } from './hero-preview';

describe('HeroPreview', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });

  function mockMatchMedia(reducedMotion: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  it('starts by showing only the first frame', () => {
    mockMatchMedia(false);
    render(<HeroPreview />);

    expect(screen.getByText('Investigating: payments API dashboard')).toBeInTheDocument();
    expect(screen.queryByText('92')).not.toBeInTheDocument();
  });

  it('never spoils a real seeded scenario — this content is homepage-only fiction', () => {
    mockMatchMedia(false);
    render(<HeroPreview />);

    expect(screen.queryByText(/cache-stampede/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout latency/i)).not.toBeInTheDocument();
  });

  it('never mounts more than a bounded window of frames at once — this is what actually guarantees the container never grows, not just the CSS height', () => {
    mockMatchMedia(false);
    vi.useFakeTimers();
    const { container } = render(<HeroPreview />);

    // Advance through every "feed" beat (telemetry/action/remediation frames, i.e.
    // everything up to but not including the final result reveal). At each point,
    // the number of simultaneously-rendered feed rows must stay bounded — if this
    // ever grows unbounded, the fixed-height CSS box would start clipping/growing
    // instead of behaving like a stable, non-resizing window.
    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const rowCount = container.querySelectorAll(
        '.hero-preview-action.fade-in, .telemetry.fade-in'
      ).length;
      expect(rowCount).toBeLessThanOrEqual(3);
    }
  });

  it('shows the result as a single, standalone view once the cycle reaches it — not layered on top of the feed', () => {
    mockMatchMedia(false);
    vi.useFakeTimers();
    const { container } = render(<HeroPreview />);

    act(() => {
      vi.advanceTimersByTime(10500); // past all feed beats (~9.5s), safely inside the result hold, before the ~13.4s reset
    });

    expect(container.querySelector('.hero-preview-result')).not.toBeNull();
    expect(container.querySelectorAll('.telemetry').length).toBe(0);
  });

  it('renders a fixed, informative snapshot (not just the bare score) when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    render(<HeroPreview />);

    // Action context and a representative telemetry beat, plus the result — chosen
    // specifically so a reduced-motion user still sees what kind of thing this demo
    // represents, not just an unexplained "92".
    expect(screen.getByText('Investigating: payments API dashboard')).toBeInTheDocument();
    expect(screen.getByText('Retry storm detected on POST /payments/authorize')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('is marked aria-hidden, since it is decorative and never the only source of any information', () => {
    mockMatchMedia(true);
    const { container } = render(<HeroPreview />);
    expect(container.querySelector('.hero-preview')).toHaveAttribute('aria-hidden', 'true');
  });
});
