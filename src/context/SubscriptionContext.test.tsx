import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';
import { subscriptionApi } from '@/api/subscription';
import { SUBSCRIPTION_PAST_DUE_EVENT, SUBSCRIPTION_SUSPENDED_EVENT } from '@/api/client';
import type { Role, SubscriptionDto } from '@/types';

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  role: 'ADMIN' as Role | null,
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/api/subscription', () => ({
  subscriptionApi: { getCurrent: vi.fn() },
}));

const mockedSubscriptionApi = vi.mocked(subscriptionApi);

const SUBSCRIPTION: SubscriptionDto = {
  planCode: 'STANDARD',
  planName: 'Standard',
  status: 'ACTIVE',
  trialEndsAt: null,
  currentPeriodEnd: '2026-12-31',
  entitlements: [
    { featureKey: 'LIBRARY', enabled: false, limitValue: null, currentUsage: null },
    { featureKey: 'MAX_STUDENTS', enabled: true, limitValue: 500, currentUsage: 120 },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </QueryClientProvider>
    );
  };
}

function setAuth(isAuthenticated: boolean, role: Role | null) {
  authState.isAuthenticated = isAuthenticated;
  authState.role = role;
}

describe('SubscriptionProvider', () => {
  it('loads the subscription for an authenticated ADMIN and answers entitlement queries', async () => {
    setAuth(true, 'ADMIN');
    mockedSubscriptionApi.getCurrent.mockResolvedValue(SUBSCRIPTION);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.subscription).not.toBeNull());
    expect(mockedSubscriptionApi.getCurrent).toHaveBeenCalledTimes(1);
    expect(result.current.subscription?.planCode).toBe('STANDARD');

    expect(result.current.isEntitled('LIBRARY')).toBe(false); // explicitly disabled
    expect(result.current.isEntitled('MAX_STUDENTS')).toBe(true);
    expect(result.current.isEntitled('ANALYTICS')).toBe(true); // absent -> permissive default

    expect(result.current.entitlementLimit('MAX_STUDENTS')).toBe(500);
    expect(result.current.entitlementLimit('LIBRARY')).toBeNull();
    expect(result.current.entitlementLimit('ANALYTICS')).toBeNull();
  });

  it('does not fetch the subscription for non-ADMIN roles and stays permissive', async () => {
    setAuth(true, 'PARENT');
    mockedSubscriptionApi.getCurrent.mockClear();

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    // Give any accidental fetch a chance to fire.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockedSubscriptionApi.getCurrent).not.toHaveBeenCalled();
    expect(result.current.subscription).toBeNull();
    expect(result.current.isEntitled('LIBRARY')).toBe(true);
    expect(result.current.isEntitled('SMS_NOTIFICATIONS')).toBe(true);
  });

  it('flips isSuspended when the suspended event fires', async () => {
    setAuth(true, 'ADMIN');
    mockedSubscriptionApi.getCurrent.mockResolvedValue(SUBSCRIPTION);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    expect(result.current.isSuspended).toBe(false);

    act(() => {
      window.dispatchEvent(new Event(SUBSCRIPTION_SUSPENDED_EVENT));
    });
    expect(result.current.isSuspended).toBe(true);
  });

  it('flips isPastDue on the past-due event and clears it on dismiss', async () => {
    setAuth(true, 'ADMIN');
    mockedSubscriptionApi.getCurrent.mockResolvedValue(SUBSCRIPTION);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    expect(result.current.isPastDue).toBe(false);

    act(() => {
      window.dispatchEvent(new Event(SUBSCRIPTION_PAST_DUE_EVENT));
    });
    expect(result.current.isPastDue).toBe(true);

    act(() => result.current.dismissPastDueBanner());
    expect(result.current.isPastDue).toBe(false);
  });

  it('resets suspended/past-due state on logout', async () => {
    setAuth(true, 'ADMIN');
    mockedSubscriptionApi.getCurrent.mockResolvedValue(SUBSCRIPTION);

    const { result, rerender } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    act(() => {
      window.dispatchEvent(new Event(SUBSCRIPTION_SUSPENDED_EVENT));
      window.dispatchEvent(new Event(SUBSCRIPTION_PAST_DUE_EVENT));
    });
    expect(result.current.isSuspended).toBe(true);
    expect(result.current.isPastDue).toBe(true);

    setAuth(false, null);
    rerender();

    await waitFor(() => expect(result.current.isSuspended).toBe(false));
    expect(result.current.isPastDue).toBe(false);
  });
});

describe('useSubscription guard', () => {
  it('throws when used outside a SubscriptionProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSubscription())).toThrow(
      'useSubscription must be used within a SubscriptionProvider',
    );
    spy.mockRestore();
  });
});
