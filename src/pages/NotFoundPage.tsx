import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl">🤷</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you’re looking for doesn’t exist.</p>
      <Link to="/dashboard" className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to dashboard
      </Link>
    </div>
  );
}
