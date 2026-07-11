import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationPreferencesApi } from '@/api/notificationPreferences';
import { extractErrorMessage } from '@/api/client';
import {
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { NotificationPreferenceDto } from '@/types';

export function NotificationPreferencesPage() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationPreferencesApi.list(),
  });

  const mutation = useMutation({
    mutationFn: (pref: NotificationPreferenceDto) =>
      notificationPreferencesApi.update(pref.eventType, {
        smsEnabled: pref.smsEnabled,
        emailEnabled: pref.emailEnabled,
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function toggle(pref: NotificationPreferenceDto, field: 'smsEnabled' | 'emailEnabled') {
    mutation.mutate({ ...pref, [field]: !pref[field] });
  }

  return (
    <div>
      <PageHeader
        title={t('pages.notificationPreferences.title')}
        description={t('pages.notificationPreferences.description')}
      />

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>{t('notificationPreferences.event')}</TH>
                  <TH className="text-center">{t('notificationPreferences.sms')}</TH>
                  <TH className="text-center">{t('notificationPreferences.email')}</TH>
                </TR>
              </THead>
              <TBody>
                {query.data.map((pref) => (
                  <TR key={pref.eventType}>
                    <TD className="font-medium text-slate-900">{t(`notificationPreferences.${pref.eventType}`)}</TD>
                    <TD className="text-center">
                      <input
                        type="checkbox"
                        checked={pref.smsEnabled}
                        disabled={mutation.isPending}
                        onChange={() => toggle(pref, 'smsEnabled')}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </TD>
                    <TD className="text-center">
                      <input
                        type="checkbox"
                        checked={pref.emailEnabled}
                        disabled={mutation.isPending}
                        onChange={() => toggle(pref, 'emailEnabled')}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )
      )}
    </div>
  );
}
