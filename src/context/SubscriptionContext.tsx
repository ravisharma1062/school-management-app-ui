import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { SUBSCRIPTION_PAST_DUE_EVENT, SUBSCRIPTION_SUSPENDED_EVENT } from '@/api/client';
import { useAuth } from './AuthContext';
import type { FeatureKey, SubscriptionDto } from '@/types';

interface SubscriptionContextValue {
  subscription: SubscriptionDto | null;
  isLoading: boolean;
  /**
   * Whether the current tenant's plan includes a feature. UX-only — the backend's
   * @RequiresEntitlement is what actually enforces this. GET /subscription is ADMIN-only (per
   * the backend contract), so for TEACHER/PARENT we have no data to gate on and default to
   * permissive (true) rather than guess; their nav/UI is unchanged from before this feature,
   * and a blocked action still surfaces the backend's 403 FEATURE_NOT_ENTITLED normally.
   */
  isEntitled: (key: FeatureKey) => boolean;
  entitlementLimit: (key: FeatureKey) => number | null;
  isSuspended: boolean;
  isPastDue: boolean;
  dismissPastDueBanner: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const [isSuspended, setIsSuspended] = useState(false);
  const [isPastDue, setIsPastDue] = useState(false);

  const query = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getCurrent(),
    enabled: isAuthenticated && role === 'ADMIN',
  });

  useEffect(() => {
    const onSuspended = () => setIsSuspended(true);
    const onPastDue = () => setIsPastDue(true);
    window.addEventListener(SUBSCRIPTION_SUSPENDED_EVENT, onSuspended);
    window.addEventListener(SUBSCRIPTION_PAST_DUE_EVENT, onPastDue);
    return () => {
      window.removeEventListener(SUBSCRIPTION_SUSPENDED_EVENT, onSuspended);
      window.removeEventListener(SUBSCRIPTION_PAST_DUE_EVENT, onPastDue);
    };
  }, []);

  // Reset transient banner/blocking state on logout so the next login starts clean.
  useEffect(() => {
    if (!isAuthenticated) {
      setIsSuspended(false);
      setIsPastDue(false);
    }
  }, [isAuthenticated]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const subscription = query.data ?? null;
    return {
      subscription,
      isLoading: query.isLoading,
      isEntitled: (key) => {
        if (!subscription) return true;
        return subscription.entitlements.find((e) => e.featureKey === key)?.enabled ?? true;
      },
      entitlementLimit: (key) => subscription?.entitlements.find((e) => e.featureKey === key)?.limitValue ?? null,
      isSuspended,
      isPastDue,
      dismissPastDueBanner: () => setIsPastDue(false),
    };
  }, [query.data, query.isLoading, isSuspended, isPastDue]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
