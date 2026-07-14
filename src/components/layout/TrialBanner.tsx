import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/context/SubscriptionContext';

/** Dismissible-per-session awareness banner shown while the school's subscription is on TRIAL. */
export function TrialBanner() {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || subscription?.status !== 'TRIAL' || !subscription.trialEndsAt) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000));

  return (
    <div
      role="status"
      className="mb-4 flex animate-fade-in items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800"
    >
      <span>
        🚀 {t('subscription.trialDaysLeft', { count: daysLeft })}{' '}
        <a href="mailto:sales@school.app" className="font-semibold underline hover:no-underline">
          {t('subscription.trialUpgradeCta')}
        </a>
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('common.close')}
        className="rounded-full px-1.5 text-brand-600 hover:bg-brand-100"
      >
        ×
      </button>
    </div>
  );
}
