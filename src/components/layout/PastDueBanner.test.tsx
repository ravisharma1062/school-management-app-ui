import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PastDueBanner } from './PastDueBanner';
import '@/i18n';

const subscriptionState = vi.hoisted(() => ({
  isPastDue: false,
  dismissPastDueBanner: vi.fn(),
}));

vi.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => subscriptionState,
}));

describe('PastDueBanner', () => {
  it('renders nothing when not past due', () => {
    subscriptionState.isPastDue = false;
    const { container } = render(<PastDueBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the warning message when past due', () => {
    subscriptionState.isPastDue = true;
    render(<PastDueBanner />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This school's subscription payment is past due. Please arrange payment soon to avoid a service interruption.",
    );
  });

  it('calls dismissPastDueBanner when the close button is clicked', async () => {
    subscriptionState.isPastDue = true;
    subscriptionState.dismissPastDueBanner = vi.fn();
    const user = userEvent.setup();
    render(<PastDueBanner />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(subscriptionState.dismissPastDueBanner).toHaveBeenCalledTimes(1);
  });
});
