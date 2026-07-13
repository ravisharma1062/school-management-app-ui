import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/context/SubscriptionContext';

/** Dismissible warning shown when a response carried X-Subscription-Status: PAST_DUE. */
export function PastDueBanner() {
  const { t } = useTranslation();
  const { isPastDue, dismissPastDueBanner } = useSubscription();

  if (!isPastDue) return null;

  return (
    <div
      role="alert"
      className="mb-4 flex animate-fade-in items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800"
    >
      <span>⚠️ {t('subscription.pastDueMessage')}</span>
      <button
        type="button"
        onClick={dismissPastDueBanner}
        aria-label={t('common.close')}
        className="rounded-full px-1.5 text-amber-600 hover:bg-amber-100"
      >
        ×
      </button>
    </div>
  );
}
