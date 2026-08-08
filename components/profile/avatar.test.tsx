import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('renders two-letter initials for a two-word name', () => {
    const { container } = render(<Avatar name="Clinton Otieno" />);
    expect(container.textContent).toBe('CO');
  });

  it('renders the first two letters, uppercased, for a single-word name', () => {
    const { container } = render(<Avatar name="clinton" />);
    expect(container.textContent).toBe('CL');
  });

  it('uses the first and last word for a name with more than two words', () => {
    const { container } = render(<Avatar name="Jane Middle Doe" />);
    expect(container.textContent).toBe('JD');
  });

  it('falls back to a question mark for an empty or whitespace-only name', () => {
    const { container } = render(<Avatar name="   " />);
    expect(container.textContent).toBe('?');
  });

  it('is decorative — hidden from assistive tech since the name is already rendered as text elsewhere', () => {
    const { container } = render(<Avatar name="Clinton Otieno" />);
    expect(container.querySelector('.avatar')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is deterministic — the same name always gets the same color', () => {
    const { container: a } = render(<Avatar name="Clinton Otieno" />);
    const { container: b } = render(<Avatar name="Clinton Otieno" />);
    const colorOf = (c: HTMLElement) => c.querySelector('.avatar')?.getAttribute('style');
    expect(colorOf(a)).toEqual(colorOf(b));
  });
});
