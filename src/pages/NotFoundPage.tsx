import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center py-24 text-center">
      <p className="text-gradient text-8xl font-extrabold tracking-tight">404</p>
      <p className="mt-2 animate-float text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{t('notFound.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('notFound.message')}</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-px hover:shadow-glow-lg"
      >
        {t('notFound.back')}
      </Link>
    </div>
  );
}
