import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCapabilityToken,
  saveCapabilityToken,
  listClaimableAttempts,
  clearClaimableAttempts,
  withCapabilityHeader,
} from './anon-tokens';

describe('anon-tokens', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns undefined for an attempt with no stored token', () => {
    expect(getCapabilityToken('unknown-attempt')).toBeUndefined();
  });

  it('round-trips a saved token for lookup by attemptId', () => {
    saveCapabilityToken({
      attemptId: 'attempt-1',
      scenarioSlug: 'cache-stampede',
      scenarioTitle: 'The Thundering Herd',
      token: 'tok-abc123',
    });

    expect(getCapabilityToken('attempt-1')).toBe('tok-abc123');
  });

  it('withCapabilityHeader attaches the header only when a token is stored', () => {
    expect(withCapabilityHeader('no-token-attempt')).toEqual({});

    saveCapabilityToken({
      attemptId: 'attempt-2',
      scenarioSlug: 'checkout-latency',
      scenarioTitle: 'Checkout Latency Spike',
      token: 'tok-xyz789',
    });

    expect(withCapabilityHeader('attempt-2')).toEqual({ 'X-Capability-Token': 'tok-xyz789' });
    // Existing headers are preserved, not clobbered.
    expect(withCapabilityHeader('attempt-2', { Accept: 'application/json' })).toEqual({
      Accept: 'application/json',
      'X-Capability-Token': 'tok-xyz789',
    });
  });

  it('saving a token for the same attemptId again replaces rather than duplicates it in the claim list', () => {
    saveCapabilityToken({
      attemptId: 'attempt-3',
      scenarioSlug: 'db-failover',
      scenarioTitle: 'DB Failover Storm',
      token: 'tok-first',
    });
    saveCapabilityToken({
      attemptId: 'attempt-3',
      scenarioSlug: 'db-failover',
      scenarioTitle: 'DB Failover Storm',
      token: 'tok-second',
    });

    const claimable = listClaimableAttempts().filter((e) => e.attemptId === 'attempt-3');
    expect(claimable).toHaveLength(1);
    expect(claimable[0]?.token).toBe('tok-second');
    expect(getCapabilityToken('attempt-3')).toBe('tok-second');
  });

  it('caps the claimable list at 20 entries, dropping the oldest first', () => {
    for (let i = 0; i < 25; i++) {
      saveCapabilityToken({
        attemptId: `attempt-${i}`,
        scenarioSlug: `scenario-${i}`,
        scenarioTitle: `Scenario ${i}`,
        token: `tok-${i}`,
      });
    }

    const claimable = listClaimableAttempts();
    expect(claimable).toHaveLength(20);
    // The 5 oldest (attempt-0..attempt-4) should have been dropped.
    expect(claimable.map((e) => e.attemptId)).not.toContain('attempt-0');
    expect(claimable.map((e) => e.attemptId)).toContain('attempt-24');
  });

  it('clearClaimableAttempts empties the claim list without touching per-attempt token lookup', () => {
    saveCapabilityToken({
      attemptId: 'attempt-4',
      scenarioSlug: 'oom-crash',
      scenarioTitle: 'OOM Crash Loop',
      token: 'tok-keep',
    });

    clearClaimableAttempts();

    expect(listClaimableAttempts()).toEqual([]);
    // Clearing the "attempts to offer for claiming after login" list is deliberately
    // separate from the per-attempt token map the play/result screens rely on to
    // keep working after a reload — this must NOT also wipe getCapabilityToken.
    expect(getCapabilityToken('attempt-4')).toBe('tok-keep');
  });
});
