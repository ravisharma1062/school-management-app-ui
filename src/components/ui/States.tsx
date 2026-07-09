import type { ReactNode } from 'react';
import { extractErrorMessage } from '@/api/client';
import { Button } from './Button';

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span
        className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-accent-500"
        style={{ animationDirection: 'reverse', animationDuration: '0.9s' }}
      />
    </span>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-4 py-12 text-slate-500">
      <Spinner className="h-9 w-9" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-gradient-to-b from-red-50/80 to-white py-10 px-6 text-center shadow-card">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl"
      >
        ⚠️
      </span>
      <p className="text-sm font-semibold text-red-800">{extractErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-gradient-to-b from-brand-50/50 to-white py-12 px-6 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 120 90"
        className="h-24 w-32 animate-float"
        fill="none"
      >
        <ellipse cx="60" cy="82" rx="42" ry="6" fill="#e0e7ff" />
        <rect x="28" y="26" width="64" height="44" rx="6" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="2" />
        <rect x="36" y="36" width="28" height="4" rx="2" fill="#a5b4fc" />
        <rect x="36" y="46" width="48" height="4" rx="2" fill="#c7d2fe" />
        <rect x="36" y="56" width="38" height="4" rx="2" fill="#c7d2fe" />
        <circle cx="92" cy="24" r="12" fill="#fdf4ff" stroke="#f0abfc" strokeWidth="2" />
        <path d="M88 24h8M92 20v8" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {message && <p className="max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
