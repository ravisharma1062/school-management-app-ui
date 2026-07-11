import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import i18n from '@/i18n';
import { authApi } from '@/api/auth';
import { SESSION_EXPIRED_EVENT } from '@/api/client';
import { tokenStorage } from '@/api/tokenStorage';
import type { Role, UserDto } from '@/types';

function syncLanguage(user: UserDto) {
  const lng = user.preferredLanguage === 'HI' ? 'hi' : 'en';
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
}

interface AuthContextValue {
  user: UserDto | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** True while we bootstrap the session on first load. */
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Updates the cached user and syncs the UI language after a language-preference change. */
  setLanguage: (updated: UserDto) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Bootstrap: if we have a token, resolve the current user profile.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!tokenStorage.getAccessToken()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
          syncLanguage(me);
        }
      } catch {
        if (!cancelled) tokenStorage.clear();
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // React to an unrecoverable session (refresh failed) from the axios layer.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login({ email, password });
    tokenStorage.set({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      role: auth.role,
    });
    const me = await authApi.me();
    setUser(me);
    syncLanguage(me);
  }, []);

  const setLanguage = useCallback((updated: UserDto) => {
    setUser(updated);
    syncLanguage(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      logout,
      setLanguage,
    }),
    [user, isBootstrapping, login, logout, setLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
