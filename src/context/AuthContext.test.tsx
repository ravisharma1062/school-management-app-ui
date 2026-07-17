import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/api/tokenStorage';
import { SESSION_EXPIRED_EVENT } from '@/api/client';
import i18n from '@/i18n';
import type { UserDto } from '@/types';

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);

const ADMIN_USER: UserDto = {
  id: 'u1',
  name: 'Alice Admin',
  email: 'alice@school.edu',
  role: 'ADMIN',
  preferredLanguage: 'EN',
  billingOwner: true,
};

const SESSION = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  role: 'ADMIN' as const,
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider bootstrap', () => {
  it('finishes bootstrapping immediately when no token is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(mockedAuthApi.me).not.toHaveBeenCalled();
  });

  it('restores the session via /auth/me when a token is stored', async () => {
    tokenStorage.set(SESSION);
    mockedAuthApi.me.mockResolvedValue(ADMIN_USER);

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isBootstrapping).toBe(true);

    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    expect(mockedAuthApi.me).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(ADMIN_USER);
    expect(result.current.role).toBe('ADMIN');
  });

  it('clears tokens when the stored session cannot be restored', async () => {
    tokenStorage.set(SESSION);
    mockedAuthApi.me.mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('login / logout', () => {
  it('login stores tokens, loads the profile and authenticates', async () => {
    mockedAuthApi.login.mockResolvedValue(SESSION);
    mockedAuthApi.me.mockResolvedValue(ADMIN_USER);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.login('alice@school.edu', 'secret');
    });

    expect(mockedAuthApi.login).toHaveBeenCalledWith({ email: 'alice@school.edu', password: 'secret' });
    expect(tokenStorage.get()).toEqual(SESSION);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(ADMIN_USER);
  });

  it('login surfaces failures and leaves the user unauthenticated', async () => {
    mockedAuthApi.login.mockRejectedValue(new Error('Bad credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('alice@school.edu', 'wrong');
      }),
    ).rejects.toThrow('Bad credentials');
    expect(result.current.isAuthenticated).toBe(false);
    expect(tokenStorage.get()).toBeNull();
  });

  it('logout clears the user and stored tokens', async () => {
    mockedAuthApi.login.mockResolvedValue(SESSION);
    mockedAuthApi.me.mockResolvedValue(ADMIN_USER);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    await act(async () => {
      await result.current.login('alice@school.edu', 'secret');
    });

    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it('syncs the UI language to the user preference on login', async () => {
    await i18n.changeLanguage('en');
    mockedAuthApi.login.mockResolvedValue(SESSION);
    mockedAuthApi.me.mockResolvedValue({ ...ADMIN_USER, preferredLanguage: 'HI' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    await act(async () => {
      await result.current.login('alice@school.edu', 'secret');
    });

    await waitFor(() => expect(i18n.language).toBe('hi'));
    await i18n.changeLanguage('en'); // restore for other tests
  });
});

describe('session expiry', () => {
  it('forces a logout when the sm:session-expired event fires', async () => {
    tokenStorage.set(SESSION);
    mockedAuthApi.me.mockResolvedValue(ADMIN_USER);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('useAuth guard', () => {
  it('throws when used outside an AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
