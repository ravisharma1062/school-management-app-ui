import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  api,
  extractErrorMessage,
  SESSION_EXPIRED_EVENT,
  SUBSCRIPTION_PAST_DUE_EVENT,
  SUBSCRIPTION_SUSPENDED_EVENT,
} from './client';
import { tokenStorage } from './tokenStorage';

const SESSION = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  role: 'ADMIN' as const,
};

const REFRESHED = {
  accessToken: 'access-2',
  refreshToken: 'refresh-2',
  role: 'ADMIN' as const,
};

function okResponse(
  config: InternalAxiosRequestConfig,
  data: unknown = { ok: true },
  headers: Record<string, string> = {},
): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers, config };
}

function httpError(
  config: InternalAxiosRequestConfig,
  status: number,
  data?: unknown,
): AxiosError {
  const response: AxiosResponse = {
    data,
    status,
    statusText: `HTTP ${status}`,
    headers: {},
    config,
  };
  return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, {}, response);
}

function listen(eventName: string): { fn: Mock; dispose: () => void } {
  const fn = vi.fn();
  window.addEventListener(eventName, fn);
  return { fn, dispose: () => window.removeEventListener(eventName, fn) };
}

const disposers: Array<() => void> = [];
function listenFor(eventName: string): Mock {
  const { fn, dispose } = listen(eventName);
  disposers.push(dispose);
  return fn;
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  api.defaults.adapter = undefined;
});

describe('request interceptor', () => {
  it('attaches Authorization: Bearer <token> when a token is stored', async () => {
    tokenStorage.set(SESSION);
    let seenAuth: string | undefined;
    api.defaults.adapter = async (config) => {
      seenAuth = config.headers.get('Authorization') as string | undefined;
      return okResponse(config);
    };

    await api.get('/students');
    expect(seenAuth).toBe('Bearer access-1');
  });

  it('sends no Authorization header when no token is stored', async () => {
    let seenAuth: unknown;
    api.defaults.adapter = async (config) => {
      seenAuth = config.headers.get('Authorization');
      return okResponse(config);
    };

    await api.get('/students');
    expect(seenAuth).toBeFalsy();
  });
});

describe('401 refresh flow', () => {
  it('refreshes once and retries the original request with the new token', async () => {
    tokenStorage.set(SESSION);
    const requests: Array<{ url?: string; auth?: string }> = [];
    api.defaults.adapter = async (config) => {
      const auth = config.headers.get('Authorization') as string | undefined;
      requests.push({ url: config.url, auth });
      if (auth !== `Bearer ${REFRESHED.accessToken}`) throw httpError(config, 401);
      return okResponse(config, { hello: 'world' });
    };
    const postSpy = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { ...REFRESHED } });

    const { data } = await api.get('/students');

    expect(data).toEqual({ hello: 'world' });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      { refreshToken: 'refresh-1' },
      expect.anything(),
    );
    // New tokens are persisted for subsequent requests.
    expect(tokenStorage.get()).toEqual(REFRESHED);
    // Original request went out twice: once with the stale token, once retried.
    expect(requests).toHaveLength(2);
    expect(requests[0].auth).toBe('Bearer access-1');
    expect(requests[1].auth).toBe('Bearer access-2');
  });

  it('single-flight: two concurrent 401s share one refresh call', async () => {
    tokenStorage.set(SESSION);
    api.defaults.adapter = async (config) => {
      const auth = config.headers.get('Authorization') as string | undefined;
      if (auth !== `Bearer ${REFRESHED.accessToken}`) throw httpError(config, 401);
      return okResponse(config, { url: config.url });
    };

    let resolveRefresh!: (value: { data: typeof REFRESHED }) => void;
    const postSpy = vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const p1 = api.get('/students');
    const p2 = api.get('/fees');
    // Let both 401s reach the response interceptor while the refresh is in flight.
    await flush();
    resolveRefresh({ data: { ...REFRESHED } });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(r1.data).toEqual({ url: '/students' });
    expect(r2.data).toEqual({ url: '/fees' });
  });

  it('on refresh failure: clears tokens, fires sm:session-expired, rejects', async () => {
    tokenStorage.set(SESSION);
    const expired = listenFor(SESSION_EXPIRED_EVENT);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 401);
    };
    const refreshError = new Error('refresh down');
    vi.spyOn(axios, 'post').mockRejectedValue(refreshError);

    await expect(api.get('/students')).rejects.toBe(refreshError);
    expect(tokenStorage.get()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh for a 401 from /auth/login', async () => {
    tokenStorage.set(SESSION); // even with a refresh token available
    const expired = listenFor(SESSION_EXPIRED_EVENT);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 401, { message: 'Bad credentials' });
    };
    const postSpy = vi.spyOn(axios, 'post');

    await expect(api.post('/auth/login', { email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      response: { status: 401 },
    });
    // The only axios.post call is the login itself going through the api instance;
    // the bare-axios refresh must never fire.
    expect(postSpy).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toEqual(SESSION); // tokens untouched
  });

  it('does not attempt a refresh when no refresh token is stored', async () => {
    const expired = listenFor(SESSION_EXPIRED_EVENT);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 401);
    };
    const postSpy = vi.spyOn(axios, 'post');

    await expect(api.get('/students')).rejects.toMatchObject({ response: { status: 401 } });
    expect(postSpy).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not loop: a 401 on the retried request is not refreshed again', async () => {
    tokenStorage.set(SESSION);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 401); // still unauthorized after refresh
    };
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { ...REFRESHED } });

    await expect(api.get('/students')).rejects.toMatchObject({ response: { status: 401 } });
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('a later 401 (after a completed refresh) triggers a fresh refresh', async () => {
    tokenStorage.set(SESSION);
    let accepted = REFRESHED.accessToken;
    api.defaults.adapter = async (config) => {
      const auth = config.headers.get('Authorization') as string | undefined;
      if (auth !== `Bearer ${accepted}`) throw httpError(config, 401);
      return okResponse(config);
    };
    const postSpy = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { ...REFRESHED } })
      .mockResolvedValueOnce({ data: { accessToken: 'access-3', refreshToken: 'refresh-3', role: 'ADMIN' } });

    await api.get('/one'); // refresh #1
    accepted = 'access-3'; // server rotates again
    await api.get('/two'); // refresh #2
    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(tokenStorage.getAccessToken()).toBe('access-3');
  });
});

describe('subscription status signals', () => {
  it('fires sm:subscription-past-due when X-Subscription-Status: PAST_DUE is present', async () => {
    const pastDue = listenFor(SUBSCRIPTION_PAST_DUE_EVENT);
    api.defaults.adapter = async (config) => okResponse(config, {}, { 'x-subscription-status': 'PAST_DUE' });

    await api.get('/students');
    expect(pastDue).toHaveBeenCalledTimes(1);
  });

  it('does not fire the past-due event for other statuses', async () => {
    const pastDue = listenFor(SUBSCRIPTION_PAST_DUE_EVENT);
    api.defaults.adapter = async (config) => okResponse(config, {}, { 'x-subscription-status': 'ACTIVE' });

    await api.get('/students');
    expect(pastDue).not.toHaveBeenCalled();
  });

  it('fires sm:subscription-suspended on 403 SUBSCRIPTION_SUSPENDED and still rejects', async () => {
    const suspended = listenFor(SUBSCRIPTION_SUSPENDED_EVENT);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 403, { code: 'SUBSCRIPTION_SUSPENDED', message: 'Suspended' });
    };

    await expect(api.get('/students')).rejects.toMatchObject({ response: { status: 403 } });
    expect(suspended).toHaveBeenCalledTimes(1);
  });

  it('does not fire the suspended event for a plain 403', async () => {
    const suspended = listenFor(SUBSCRIPTION_SUSPENDED_EVENT);
    api.defaults.adapter = async (config) => {
      throw httpError(config, 403, { code: 'FEATURE_NOT_ENTITLED' });
    };

    await expect(api.get('/students')).rejects.toMatchObject({ response: { status: 403 } });
    expect(suspended).not.toHaveBeenCalled();
  });
});

describe('extractErrorMessage', () => {
  const config = { headers: {} } as InternalAxiosRequestConfig;

  it('prefers the backend "message" field of an axios error', () => {
    const err = httpError(config, 400, { message: 'Roll number already exists', error: 'Bad Request' });
    expect(extractErrorMessage(err)).toBe('Roll number already exists');
  });

  it('falls back to the backend "error" field', () => {
    const err = httpError(config, 400, { error: 'Bad Request' });
    expect(extractErrorMessage(err)).toBe('Bad Request');
  });

  it('falls back to the axios error message when the response has no body', () => {
    const err = httpError(config, 500);
    expect(extractErrorMessage(err)).toBe('Request failed with status code 500');
  });

  it('uses the message of a plain Error', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns the fallback for non-Error values', () => {
    expect(extractErrorMessage('nope')).toBe('Something went wrong');
    expect(extractErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
    expect(extractErrorMessage({ message: 'not an Error instance' })).toBe('Something went wrong');
  });
});
