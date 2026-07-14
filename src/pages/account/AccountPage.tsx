import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { brandingApi } from '@/api/branding';
import { dataExportApi } from '@/api/dataExport';
import { billingApi } from '@/api/billing';
import { useBranding } from '@/context/BrandingContext';
import { extractErrorMessage } from '@/api/client';
import { formatDate, formatMoney, todayIso } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { PaymentClaimStatus, PaymentMethod, SchoolStatus } from '@/types';

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
                        <span className="text-xs text-slate-400">
                          {e.currentUsage != null
                            ? t('account.usageLimit', { usage: e.currentUsage, limit: e.limitValue })
                            : t('account.limit', { count: e.limitValue })}
                        </span>
                      )}
                      <Badge tone={e.enabled ? 'green' : 'gray'}>
                        {e.enabled ? t('account.included') : t('account.notIncluded')}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <BillingSection />

            <BrandingSection
              isEntitled={query.data.entitlements.find((e) => e.featureKey === 'BRANDING')?.enabled ?? false}
            />

            <DataExportSection />
          </div>
        )
      )}
    </div>
  );
}

const CLAIM_STATUS_TONE: Record<PaymentClaimStatus, 'green' | 'yellow' | 'red'> = {
  PENDING_VERIFICATION: 'yellow',
  VERIFIED: 'green',
  REJECTED: 'red',
};

const PAYMENT_METHODS: PaymentMethod[] = ['NEFT', 'CHEQUE', 'DEMAND_DRAFT'];

const emptyClaimForm = {
  amount: '',
  method: 'NEFT' as PaymentMethod,
  referenceNumber: '',
  periodStart: todayIso(),
  periodEnd: '',
};

function BillingSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyClaimForm);
  const [error, setError] = useState<string | null>(null);

  const instructionsQuery = useQuery({
    queryKey: ['billing-instructions'],
    queryFn: () => billingApi.getPaymentInstructions(),
  });
  const historyQuery = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => billingApi.getMyHistory({ sort: 'submittedAt,desc' }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      billingApi.submitPayment({
        amount: Number(form.amount),
        method: form.method,
        referenceNumber: form.referenceNumber,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-history'] });
      setForm(emptyClaimForm);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    submitMutation.mutate();
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-sm font-bold text-slate-800">{t('billing.title')}</h2>
      <p className="mb-4 text-xs text-slate-500">{t('billing.description')}</p>

      {instructionsQuery.data && (
        <div className="mb-5 whitespace-pre-wrap rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          {instructionsQuery.data}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mb-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('billing.amount')}
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select
            label={t('billing.method')}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`billing.methodLabel.${m}`)}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label={t('billing.referenceNumber')}
          required
          maxLength={100}
          value={form.referenceNumber}
          onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('billing.periodStart')}
            type="date"
            required
            value={form.periodStart}
            onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
          />
          <Input
            label={t('billing.periodEnd')}
            type="date"
            required
            value={form.periodEnd}
            onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
          />
        </div>
        <Button type="submit" size="sm" loading={submitMutation.isPending}>
          {t('billing.reportPayment')}
        </Button>
      </form>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('billing.history')}</h3>
      {historyQuery.isLoading ? (
        <LoadingState />
      ) : historyQuery.data && historyQuery.data.content.length === 0 ? (
        <p className="text-sm text-slate-500">{t('billing.noHistory')}</p>
      ) : (
        historyQuery.data && (
          <Table>
            <THead>
              <TR>
                <TH>{t('billing.submitted')}</TH>
                <TH>{t('billing.method')}</TH>
                <TH>{t('billing.amount')}</TH>
                <TH>{t('billing.period')}</TH>
                <TH>{t('common.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {historyQuery.data.content.map((claim) => (
                <TR key={claim.id}>
                  <TD>{formatDate(claim.submittedAt)}</TD>
                  <TD>{t(`billing.methodLabel.${claim.method}`)}</TD>
                  <TD>{formatMoney(claim.amount)}</TD>
                  <TD>
                    {formatDate(claim.periodStart)} – {formatDate(claim.periodEnd)}
                  </TD>
                  <TD>
                    <Badge tone={CLAIM_STATUS_TONE[claim.status]}>{t(`billing.claimStatus.${claim.status}`)}</Badge>
                    {claim.status === 'REJECTED' && claim.notes && (
                      <p className="mt-1 text-xs text-slate-400">{claim.notes}</p>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )
      )}
    </Card>
  );
}

function DataExportSection() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: () => dataExportApi.download(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'school-data-export.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-sm font-bold text-slate-800">{t('dataExport.title')}</h2>
      <p className="mb-4 text-xs text-slate-500">{t('dataExport.description')}</p>
      {error && (
        <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button
        size="sm"
        variant="secondary"
        loading={exportMutation.isPending}
        onClick={() => {
          setError(null);
          exportMutation.mutate();
        }}
      >
        {t('dataExport.downloadButton')}
      </Button>
    </Card>
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
