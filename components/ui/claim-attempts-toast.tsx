'use client';

import { useEffect, useRef } from 'react';
import { useClaimAttemptsOnLogin } from '@/lib/use-claim-attempts';
import { useToast } from '@/lib/toast-context';

/**
 * Mounted once at the root layout so it fires regardless of which page the user is on
 * when they authenticate (login, verify-email, or an already-logged-in reload).
 * Renders nothing itself — M7 generalized the one-off toast this used to render
 * directly into the shared `useToast()` push, so this is now just the bridge between
 * "a claim happened" (the hook) and "show something about it" (the toast system).
 */
export function ClaimAttemptsToast() {
  const notice = useClaimAttemptsOnLogin();
  const { push } = useToast();
  const shownFor = useRef<string | null>(null);

  useEffect(() => {
    if (!notice || shownFor.current === notice) return;
    shownFor.current = notice;
    push(notice, 'success');
  }, [notice, push]);

  return null;
}
