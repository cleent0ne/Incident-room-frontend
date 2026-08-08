import { describe, expect, it } from 'vitest';
import { matchNodeIdForSource } from './topology';
import type { TopologyDto } from '@/lib/types';

const topology: TopologyDto = {
  nodes: [
    { id: 'payments-db', type: 'database', label: 'Payments DB' },
    { id: 'checkout-api', type: 'service', label: 'Checkout API' },
  ],
  edges: [{ from: 'checkout-api', to: 'payments-db' }],
};

describe('matchNodeIdForSource', () => {
  it('matches an exact source string to a node id', () => {
    expect(matchNodeIdForSource(topology, 'payments-db')).toBe('payments-db');
  });

  it('matches case-insensitively', () => {
    expect(matchNodeIdForSource(topology, 'PAYMENTS-DB')).toBe('payments-db');
  });

  it('matches when the source is a more specific superstring of a node id', () => {
    // Scenario authors write free-text source strings like "payments-db-primary",
    // which won't be byte-identical to the node id "payments-db" — this is the
    // common real case, not the exact-match case above.
    expect(matchNodeIdForSource(topology, 'payments-db-primary')).toBe('payments-db');
  });

  it('matches when the node id is a superstring of the source', () => {
    expect(matchNodeIdForSource(topology, 'checkout')).toBe('checkout-api');
  });

  it('returns undefined rather than guessing when nothing reasonably matches', () => {
    // A missed highlight is a minor cosmetic gap; a wrong highlight would
    // misrepresent the scenario's own topology, which is worse — see the function's
    // own doc comment on why this returns undefined instead of a best-effort guess.
    expect(matchNodeIdForSource(topology, 'auth-service')).toBeUndefined();
  });

  it('returns undefined for an empty or whitespace-only source', () => {
    expect(matchNodeIdForSource(topology, '   ')).toBeUndefined();
  });
});
