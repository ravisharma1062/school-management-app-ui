import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import '@/i18n';

const authState = vi.hoisted(() => ({
  login: vi.fn(),
  isAuthenticated: false,
  isBootstrapping: false,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders the email and password fields', () => {
    authState.isAuthenticated = false;
    renderLoginPage();
    expect(screen.getByLabelText('Email', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Password', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in →' })).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    authState.isAuthenticated = true;
    authState.isBootstrapping = false;
    renderLoginPage();
    expect(screen.getByText('DASHBOARD PAGE')).toBeInTheDocument();
    authState.isAuthenticated = false;
  });

  it('does not redirect while still bootstrapping, even if authenticated', () => {
    authState.isAuthenticated = true;
    authState.isBootstrapping = true;
    renderLoginPage();
    expect(screen.getByLabelText('Email', { exact: false })).toBeInTheDocument();
    authState.isAuthenticated = false;
    authState.isBootstrapping = false;
  });

  it('submits email/password and navigates to /dashboard on success', async () => {
    authState.login = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email', { exact: false }), 'admin@school.edu');
    await user.type(screen.getByLabelText('Password', { exact: false }), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in →' }));

    await waitFor(() => expect(authState.login).toHaveBeenCalledWith('admin@school.edu', 'secret123'));
    await waitFor(() => expect(screen.getByText('DASHBOARD PAGE')).toBeInTheDocument());
  });

  it('shows an error message when login fails and does not navigate', async () => {
    authState.login = vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email', { exact: false }), 'admin@school.edu');
    await user.type(screen.getByLabelText('Password', { exact: false }), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.queryByText('DASHBOARD PAGE')).not.toBeInTheDocument();
  });

  it('navigates to the original "from" location after a successful login', async () => {
    authState.login = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/login', state: { from: { pathname: '/students' } } }]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/students" element={<div>STUDENTS PAGE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email', { exact: false }), 'admin@school.edu');
    await user.type(screen.getByLabelText('Password', { exact: false }), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in →' }));

    await waitFor(() => expect(screen.getByText('STUDENTS PAGE')).toBeInTheDocument());
  });
});
