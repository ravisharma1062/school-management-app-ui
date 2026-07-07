import type { Role } from '@/types';

const ACCESS_KEY = 'sm.accessToken';
const REFRESH_KEY = 'sm.refreshToken';
const ROLE_KEY = 'sm.role';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  role: Role;
}

export const tokenStorage = {
  get(): StoredSession | null {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const role = localStorage.getItem(ROLE_KEY) as Role | null;
    if (!accessToken || !refreshToken || !role) return null;
    return { accessToken, refreshToken, role };
  },

  set(session: StoredSession): void {
    localStorage.setItem(ACCESS_KEY, session.accessToken);
    localStorage.setItem(REFRESH_KEY, session.refreshToken);
    localStorage.setItem(ROLE_KEY, session.role);
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};
