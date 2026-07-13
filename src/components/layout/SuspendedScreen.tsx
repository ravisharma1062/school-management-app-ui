import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

/** Full-screen block rendered instead of the app when the backend returns 403 SUBSCRIPTION_SUSPENDED. */
export function SuspendedScreen() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-3xl">
        🚫
      </span>
      <h1 className="text-xl font-extrabold text-slate-900">{t('subscription.suspendedTitle')}</h1>
      <p className="max-w-md text-sm text-slate-500">{t('subscription.suspendedMessage')}</p>
      <Button variant="secondary" onClick={logout}>
        {t('common.signOut')}
      </Button>
    </div>
  );
}
