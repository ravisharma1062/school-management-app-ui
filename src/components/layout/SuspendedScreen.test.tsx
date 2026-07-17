import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuspendedScreen } from './SuspendedScreen';
import '@/i18n';

const authState = vi.hoisted(() => ({
  logout: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

describe('SuspendedScreen', () => {
  it('renders the suspended message', () => {
    render(<SuspendedScreen />);
    expect(screen.getByText('Subscription suspended')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This school's subscription is currently suspended. Please contact your administrator or the school's billing owner to restore access.",
      ),
    ).toBeInTheDocument();
  });

  it('calls logout when the sign-out button is clicked', async () => {
    authState.logout = vi.fn();
    const user = userEvent.setup();
    render(<SuspendedScreen />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(authState.logout).toHaveBeenCalledTimes(1);
  });
});
