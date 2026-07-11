import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { Button, Input } from '@/components/ui';

interface LocationState {
  from?: { pathname: string };
}

/** Decorative campus illustration for the login hero panel. */
function CampusIllustration() {
  return (
    <svg viewBox="0 0 480 320" fill="none" className="w-full max-w-md drop-shadow-2xl" aria-hidden="true">
      {/* sun */}
      <circle cx="404" cy="56" r="28" fill="#fde68a" className="animate-float-slow" />
      <circle cx="404" cy="56" r="40" fill="#fde68a" opacity="0.3" />
      {/* clouds */}
      <g className="animate-float" opacity="0.9">
        <ellipse cx="96" cy="52" rx="34" ry="13" fill="white" opacity="0.85" />
        <ellipse cx="122" cy="44" rx="24" ry="11" fill="white" opacity="0.7" />
      </g>
      <g className="animate-float-slow" opacity="0.8">
        <ellipse cx="300" cy="90" rx="28" ry="10" fill="white" opacity="0.7" />
      </g>
      {/* ground */}
      <ellipse cx="240" cy="286" rx="220" ry="26" fill="#ffffff" opacity="0.25" />
      {/* school building */}
      <rect x="120" y="150" width="240" height="120" rx="8" fill="#ffffff" opacity="0.95" />
      <rect x="200" y="120" width="80" height="150" rx="6" fill="#eef2ff" />
      <path d="M196 122l44-34 44 34z" fill="#c7d2fe" />
      <path d="M240 88v-22" stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
      <path d="M240 66h26l-6 8 6 8h-26z" fill="#f472b6" className="animate-wiggle" style={{ transformOrigin: '240px 66px' }} />
      {/* clock */}
      <circle cx="240" cy="112" r="13" fill="white" stroke="#818cf8" strokeWidth="3" />
      <path d="M240 105v7l5 4" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      {/* door */}
      <rect x="226" y="216" width="28" height="54" rx="4" fill="#6366f1" />
      <circle cx="248" cy="244" r="2.5" fill="#e0e7ff" />
      {/* windows */}
      {[138, 168, 292, 322].map((x) => (
        <g key={x}>
          <rect x={x} y="170" width="24" height="26" rx="4" fill="#c7d2fe" />
          <rect x={x} y="216" width="24" height="26" rx="4" fill="#c7d2fe" />
        </g>
      ))}
      {/* trees */}
      <g className="animate-float-slow">
        <rect x="76" y="234" width="9" height="36" rx="4" fill="#a16207" />
        <circle cx="80" cy="216" r="26" fill="#4ade80" />
        <circle cx="64" cy="228" r="18" fill="#86efac" />
      </g>
      <g className="animate-float">
        <rect x="396" y="238" width="9" height="32" rx="4" fill="#a16207" />
        <circle cx="400" cy="220" r="24" fill="#4ade80" />
        <circle cx="416" cy="232" r="16" fill="#86efac" />
      </g>
      {/* floating school icons */}
      <g className="animate-float">
        <rect x="44" y="120" width="44" height="34" rx="8" fill="#f0abfc" opacity="0.9" />
        <path d="M52 131h28M52 139h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="animate-float-slow">
        <circle cx="428" cy="150" r="20" fill="#7dd3fc" opacity="0.9" />
        <path d="M420 150l6 6 12-12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Hero panel */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 animate-blob rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] animate-blob-slow rounded-full bg-accent-400/25 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 h-64 w-64 animate-blob rounded-full bg-sky-400/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex max-w-lg flex-col items-center px-10 text-center">
          <CampusIllustration />
          <h2 className="mt-8 animate-fade-up text-3xl font-extrabold tracking-tight text-white">
            {t('login.heroTitle')}
          </h2>
          <p className="mt-3 animate-fade-up text-brand-100" style={{ animationDelay: '0.15s' }}>
            {t('login.heroSubtitle')}
          </p>
          <div className="stagger mt-8 flex flex-wrap justify-center gap-2">
            {['🎓 Students', '📋 Attendance', '🗓️ Timetable', '📚 Homework', '💰 Fees', '📢 Notices'].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="bg-mesh relative flex w-full items-center justify-center bg-slate-50 px-4 lg:w-1/2">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 animate-blob rounded-full bg-brand-300/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 animate-blob-slow rounded-full bg-accent-300/25 blur-3xl" />
        </div>
        <div className="relative w-full max-w-sm animate-fade-up">
          <div className="mb-8 text-center">
            <span className="inline-flex h-16 w-16 animate-float items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 text-3xl shadow-glow-lg">
              🎓
            </span>
            <h1 className="text-gradient mt-4 text-3xl font-extrabold tracking-tight">{t('login.brand')}</h1>
            <p className="mt-2 text-sm text-slate-500">{t('login.welcome')}</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="glass space-y-4 rounded-3xl p-7 shadow-card"
            noValidate
          >
            {error && (
              <div
                role="alert"
                className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <Input
              label={t('login.email')}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@school.edu"
            />
            <Input
              label={t('login.password')}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button type="submit" className="w-full" loading={submitting}>
              {t('login.signIn')}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            {t('login.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
