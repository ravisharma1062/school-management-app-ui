import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi } from '@/api/branding';
import { useAuth } from './AuthContext';
import type { BrandingDto } from '@/types';

interface BrandingContextValue {
  branding: BrandingDto | null;
  /** An object URL for the logo image, or null if the school has none set. Revoked automatically. */
  logoUrl: string | null;
  refetch: () => void;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Unlike GET /subscription (ADMIN-only), GET /branding is readable by every role — the whole
  // portal needs to theme itself, not just admins.
  const query = useQuery({
    queryKey: ['branding'],
    queryFn: () => brandingApi.getCurrent(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!query.data?.hasLogo) {
      setLogoUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    brandingApi
      .getLogoObjectUrl()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setLogoUrl(url);
      })
      .catch(() => setLogoUrl(null));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [query.data?.hasLogo]);

  useEffect(() => {
    if (!isAuthenticated) setLogoUrl(null);
  }, [isAuthenticated]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding: query.data ?? null,
      logoUrl,
      refetch: () => void queryClient.invalidateQueries({ queryKey: ['branding'] }),
    }),
    [query.data, logoUrl, queryClient],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within a BrandingProvider');
  return ctx;
}
