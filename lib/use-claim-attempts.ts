'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';
import { post } from './api';
import { listClaimableAttempts, clearClaimableAttempts } from './anon-tokens';
import type { ClaimAttemptsResponse } from './types';

/**
 * Fires `POST /attempts/claim` automatically the moment `user` becomes truthy —
 * covers login, register-then-verify, and a page reload of an already-authenticated
 * session alike, from one place, rather than duplicating a "claim now" call at the end
 * of every auth flow.
 *
 * No confirmation UI: the tokens being claimed are the ones THIS browser stored from
 * THIS browser's own anonymous play (`lib/anon-tokens.ts`), so there's nothing to ask
 * permission for — it's the same data, just now attached to an account. Already-owned
 * tokens claim idempotently (count toward `claimedCount` again, harmless); tokens that
 * turn out to belong to a different account are silently skipped server-side
 * (`skippedCount`) — no error surface needed for that case per the confirmed behavior.
 *
 * Runs at most once per `user` transition (`claimedRef`) and clears the local claimable
 * list only on a successful round-trip — a failed attempt (rate limit, network blip)
 * leaves the list in place so a later login/reload can retry rather than losing the
 * tokens for good.
 */
export function useClaimAttemptsOnLogin(): string | null {
  const { user } = useAuth();
  const claimedRef = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      claimedRef.current = false;
      return;
    }
    if (claimedRef.current) return;

    const claimable = listClaimableAttempts();
    if (claimable.length === 0) return;

    claimedRef.current = true;
    const capabilityTokens = claimable.map((entry) => entry.token);

    post<ClaimAttemptsResponse>('/api/v1/attempts/claim', { capabilityTokens })
      .then((result) => {
        clearClaimableAttempts();
        if (result.claimedCount > 0) {
          const noun = result.claimedCount === 1 ? 'incident' : 'incidents';
          setNotice(`Linked ${result.claimedCount} ${noun} you played earlier to your account.`);
        }
      })
      .catch(() => {
        // RATE_LIMITED (5/minute) or a network blip — not worth surfacing as an
        // error to the user mid-navigation. Reset so a later transition can retry.
        claimedRef.current = false;
      });
  }, [user]);

  return notice;
}
