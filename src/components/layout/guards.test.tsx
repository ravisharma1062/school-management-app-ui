import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RoleGuard } from './RoleGuard';
import type { Role } from '@/types';
import '@/i18n';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isBootstrapping: false,
  role: null as Role | null,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isBootstrapping = false;
  authState.role = null;
});

describe('RequireAuth', () => {
  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/students" element={<div>STUDENTS PAGE</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows a session-restore loading state while bootstrapping', () => {
    authState.isBootstrapping = true;
    renderAt('/students');
    expect(screen.getByText('Restoring your session…')).toBeInTheDocument();
    expect(screen.queryByText('STUDENTS PAGE')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    renderAt('/students');
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('STUDENTS PAGE')).not.toBeInTheDocument();
  });

  it('renders the protected outlet for authenticated users', () => {
    authState.isAuthenticated = true;
    authState.role = 'ADMIN';
    renderAt('/students');
    expect(screen.getByText('STUDENTS PAGE')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  function renderAt(allow: Role[], path = '/users') {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
          <Route element={<RoleGuard allow={allow} />}>
            <Route path="/users" element={<div>USERS PAGE</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders the outlet when the role is allowed', () => {
    authState.role = 'ADMIN';
    renderAt(['ADMIN']);
    expect(screen.getByText('USERS PAGE')).toBeInTheDocument();
  });

  it('redirects to /dashboard when the role is not allowed', () => {
    authState.role = 'PARENT';
    renderAt(['ADMIN', 'TEACHER']);
    expect(screen.getByText('DASHBOARD PAGE')).toBeInTheDocument();
    expect(screen.queryByText('USERS PAGE')).not.toBeInTheDocument();
  });

  it('redirects to /dashboard when there is no role at all', () => {
    authState.role = null;
    renderAt(['ADMIN']);
    expect(screen.getByText('DASHBOARD PAGE')).toBeInTheDocument();
  });

  it('allows any listed role, not just ADMIN', () => {
    authState.role = 'TEACHER';
    renderAt(['ADMIN', 'TEACHER']);
    expect(screen.getByText('USERS PAGE')).toBeInTheDocument();
  });
});
