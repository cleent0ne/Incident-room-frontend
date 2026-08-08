'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error';

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Queue a toast. Auto-dismisses after ~6s; multiple toasts stack downward from
   * the same top-right corner the original claim-attempts toast used. */
  push: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_AFTER_MS = 6000;
const TOAST_STEP_PX = 56;

/**
 * Generalizes the one-off toast M5 built for the claim-attempts notice into a shared
 * primitive any part of the app can push to (e.g. a mutation failure toast, a "saved"
 * confirmation) instead of every feature re-inventing its own timer/dismiss state.
 * Mount once at the root layout, above everything that might call `useToast()`.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, DISMISS_AFTER_MS);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`toast${toast.variant === 'error' ? ' toast-error' : ''}`}
          style={{ top: 18 + index * TOAST_STEP_PX }}
        >
          {toast.message}
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
