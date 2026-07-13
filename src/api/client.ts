import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthResponse } from '@/types';
import { tokenStorage } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_PREFIX = '/api/v1';

/**
 * Fired when the session can no longer be recovered (refresh failed / absent).
 * AuthContext listens for this to force a logout + redirect to /login.
 */
export const SESSION_EXPIRED_EVENT = 'sm:session-expired';

/** Fired when the backend rejects a request with 403 SUBSCRIPTION_SUSPENDED. SubscriptionContext
 * listens for this to render a full-screen blocking state. */
export const SUBSCRIPTION_SUSPENDED_EVENT = 'sm:subscription-suspended';

/** Fired when a successful response carries the X-Subscription-Status: PAST_DUE header.
 * SubscriptionContext listens for this to show a dismissible banner. */
export const SUBSCRIPTION_PAST_DUE_EVENT = 'sm:subscription-past-due';

function emitSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor: attach the access token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Response interceptor: transparent single-flight refresh on 401 ---
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  // Bare axios call so we don't recurse through this interceptor.
  const { data } = await axios.post<AuthResponse>(
    `${BASE_URL}${API_PREFIX}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  tokenStorage.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    role: data.role,
  });
  return data.accessToken;
}

api.interceptors.response.use(
  (response) => {
    if (response.headers['x-subscription-status'] === 'PAST_DUE') {
      window.dispatchEvent(new Event(SUBSCRIPTION_PAST_DUE_EVENT));
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes('/auth/refresh');
    const isLoginCall = original?.url?.includes('/auth/login');

    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (status === 403 && code === 'SUBSCRIPTION_SUSPENDED') {
      window.dispatchEvent(new Event(SUBSCRIPTION_SUSPENDED_EVENT));
    }

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isRefreshCall &&
      !isLoginCall &&
      tokenStorage.getRefreshToken()
    ) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        tokenStorage.clear();
        emitSessionExpired();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

/** Normalizes an axios error into a user-facing message from the backend ErrorResponse. */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
