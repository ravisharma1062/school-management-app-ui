import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center py-24 text-center">
      <p className="text-gradient text-8xl font-extrabold tracking-tight">404</p>
      <p className="mt-2 animate-float text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you’re looking for doesn’t exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-px hover:shadow-glow-lg"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
