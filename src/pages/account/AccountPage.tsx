import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { formatDate } from '@/lib/format';
import { Badge, Card, ErrorState, LoadingState, PageHeader } from '@/components/ui';
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
          </div>
        )
      )}
    </div>
  );
}
