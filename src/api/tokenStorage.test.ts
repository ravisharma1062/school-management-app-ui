import { describe, expect, it } from 'vitest';
import { tokenStorage } from './tokenStorage';

const session = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  role: 'ADMIN' as const,
};

describe('tokenStorage', () => {
  it('returns null when nothing is stored', () => {
    expect(tokenStorage.get()).toBeNull();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('round-trips a stored session', () => {
    tokenStorage.set(session);
    expect(tokenStorage.get()).toEqual(session);
    expect(tokenStorage.getAccessToken()).toBe('access-123');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-456');
  });

  it('uses the sm.* localStorage keys', () => {
    tokenStorage.set(session);
    expect(localStorage.getItem('sm.accessToken')).toBe('access-123');
    expect(localStorage.getItem('sm.refreshToken')).toBe('refresh-456');
    expect(localStorage.getItem('sm.role')).toBe('ADMIN');
  });

  it('get() returns null when any of the three parts is missing', () => {
    tokenStorage.set(session);
    localStorage.removeItem('sm.accessToken');
    expect(tokenStorage.get()).toBeNull();

    tokenStorage.set(session);
    localStorage.removeItem('sm.refreshToken');
    expect(tokenStorage.get()).toBeNull();

    tokenStorage.set(session);
    localStorage.removeItem('sm.role');
    expect(tokenStorage.get()).toBeNull();
  });

  it('clear() removes all keys', () => {
    tokenStorage.set(session);
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
    expect(localStorage.getItem('sm.accessToken')).toBeNull();
    expect(localStorage.getItem('sm.refreshToken')).toBeNull();
    expect(localStorage.getItem('sm.role')).toBeNull();
  });
});
