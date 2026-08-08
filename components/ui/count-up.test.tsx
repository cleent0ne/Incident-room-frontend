import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountUp } from './count-up';

describe('CountUp', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function mockMatchMedia(reducedMotion: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  it('jumps straight to the target value under prefers-reduced-motion, no animation', () => {
    mockMatchMedia(true);
    render(<CountUp target={92} />);
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('starts at 0 (or the given `from`) rather than the target when motion is not reduced', () => {
    mockMatchMedia(false);
    render(<CountUp target={92} />);
    // Immediately after mount, before any animation frame has run, the displayed
    // value should be the starting point, not the final score — this is what makes
    // it a genuine reveal rather than an instant appearance.
    expect(screen.queryByText('92')).not.toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('starts at a custom `from` value when provided', () => {
    mockMatchMedia(false);
    render(<CountUp target={150} from={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
