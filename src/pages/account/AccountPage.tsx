import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { brandingApi } from '@/api/branding';
import { useBranding } from '@/context/BrandingContext';
import { extractErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/format';
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import type { SchoolStatus } from '@/types';

const STATUS_TONE: Record<SchoolStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  TRIAL: 'yellow',
  ACTIVE: 'green',
  PAST_DUE: 'yellow',
  SUSPENDED: 'red',
  CANCELLED: 'gray',
};

export function AccountPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getCurrent(),
  });

  return (
    <div>
      <PageHeader title={t('pages.account.title')} description={t('pages.account.description')} />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        query.data && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t('account.currentPlan')}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900">{query.data.planName}</p>
                </div>
                <Badge tone={STATUS_TONE[query.data.status]}>{t(`account.status.${query.data.status}`)}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {query.data.trialEndsAt && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t('account.trialEndsAt')}</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(query.data.trialEndsAt)}</p>
                  </div>
                )}
                {query.data.currentPeriodEnd && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t('account.currentPeriodEnd')}</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(query.data.currentPeriodEnd)}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-3 text-sm font-bold text-slate-800">{t('account.entitlements')}</h2>
              <ul className="divide-y divide-slate-100">
                {query.data.entitlements.map((e) => (
                  <li key={e.featureKey} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-medium text-slate-700">{t(`account.feature.${e.featureKey}`)}</span>
                    <span className="flex items-center gap-2">
                      {e.limitValue != null && (
                        <span className="text-xs text-slate-400">{t('account.limit', { count: e.limitValue })}</span>
                      )}
                      <Badge tone={e.enabled ? 'green' : 'gray'}>
                        {e.enabled ? t('account.included') : t('account.notIncluded')}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <BrandingSection
              isEntitled={query.data.entitlements.find((e) => e.featureKey === 'BRANDING')?.enabled ?? false}
            />
          </div>
        )
      )}
    </div>
  );
}

function BrandingSection({ isEntitled }: { isEntitled: boolean }) {
  const { t } = useTranslation();
  const { branding, logoUrl, refetch } = useBranding();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? '#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState(branding?.secondaryColor ?? '#D946EF');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await brandingApi.uploadLogo(file);
      refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onSaveColors() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await brandingApi.updateColors(primaryColor, secondaryColor);
      refetch();
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-sm font-bold text-slate-800">{t('branding.title')}</h2>
      <p className="mb-4 text-xs text-slate-500">{t('branding.description')}</p>

      {!isEntitled ? (
        <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">{t('branding.notEntitled')}</p>
      ) : (
        <div className="space-y-5">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('branding.logo')}</p>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-xs text-slate-400">{t('branding.noLogo')}</span>
                )}
              </div>
              <label>
                <span className="sr-only">{t('branding.chooseFile')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  disabled={uploading}
                  className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {uploading && <p className="mt-1 text-xs text-slate-400">{t('branding.uploading')}</p>}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="primary-color">
                {t('branding.primaryColor')}
              </label>
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="secondary-color">
                {t('branding.secondaryColor')}
              </label>
              <input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" loading={saving} onClick={onSaveColors}>
              {t('branding.save')}
            </Button>
            {saved && <span className="text-xs font-medium text-emerald-600">{t('branding.saved')}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
