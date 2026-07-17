import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrialBanner } from './TrialBanner';
import type { SubscriptionDto, UserDto } from '@/types';
import '@/i18n';

const subscriptionState = vi.hoisted(() => ({
  subscription: null as SubscriptionDto | null,
}));
const authState = vi.hoisted(() => ({
  user: null as UserDto | null,
}));

vi.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => subscriptionState,
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

function trialSubscription(overrides: Partial<SubscriptionDto> = {}): SubscriptionDto {
  return {
    planCode: 'BASIC',
    planName: 'Basic',
    status: 'TRIAL',
    trialEndsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    currentPeriodEnd: null,
    entitlements: [],
    ...overrides,
  };
}

const BILLING_OWNER: UserDto = {
  id: 'u1',
  name: 'Billing Owner',
  email: 'owner@school.edu',
  role: 'ADMIN',
  preferredLanguage: 'EN',
  billingOwner: true,
};

const NON_BILLING_OWNER: UserDto = { ...BILLING_OWNER, billingOwner: false };

describe('TrialBanner', () => {
  it('renders nothing when there is no subscription', () => {
    subscriptionState.subscription = null;
    authState.user = null;
    const { container } = render(<TrialBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the subscription is not on TRIAL', () => {
    subscriptionState.subscription = trialSubscription({ status: 'ACTIVE' });
    authState.user = null;
    const { container } = render(<TrialBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when trialEndsAt is missing', () => {
    subscriptionState.subscription = trialSubscription({ trialEndsAt: null });
    authState.user = null;
    const { container } = render(<TrialBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows days left and an upgrade CTA for the billing owner', () => {
    subscriptionState.subscription = trialSubscription({
      trialEndsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    });
    authState.user = BILLING_OWNER;
    render(<TrialBanner />);
    expect(screen.getByRole('status')).toHaveTextContent('days left in your free trial.');
    expect(screen.getByRole('link', { name: 'Contact us to upgrade' })).toHaveAttribute(
      'href',
      'mailto:sales@school.app',
    );
  });

  it('shows "ask your billing owner" copy for a non-billing-owner user', () => {
    subscriptionState.subscription = trialSubscription();
    authState.user = NON_BILLING_OWNER;
    render(<TrialBanner />);
    expect(screen.getByText('Ask your billing owner to upgrade')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('dismisses on close-button click and stays hidden', async () => {
    subscriptionState.subscription = trialSubscription();
    authState.user = BILLING_OWNER;
    const user = userEvent.setup();
    render(<TrialBanner />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
