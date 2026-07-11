import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppShell() {
  const { t } = useTranslation();
  const { user, role, logout, setLanguage } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!role) return null;

  async function onLanguageChange(lang: 'EN' | 'HI') {
    const updated = await usersApi.updateMyLanguage(lang);
    setLanguage(updated);
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-mesh min-h-screen bg-slate-50">
      {/* Decorative floating blobs behind everything */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 animate-blob rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] animate-blob-slow rounded-full bg-accent-300/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg shadow-glow">
            🎓
          </span>
          <div className="leading-tight">
            <span className="text-gradient block text-lg font-extrabold tracking-tight">School Management</span>
            <span className="hidden text-[11px] font-medium uppercase tracking-widest text-slate-400 sm:block">
              {t(`roles.${role}`)} {t('common.portal')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={user?.preferredLanguage ?? 'EN'} onChange={onLanguageChange} />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs font-medium text-brand-600">{t(`roles.${role}`)}</p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 p-[2px] shadow-glow"
            title={user?.email}
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700">
              {initials}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            {t('common.signOut')}
          </button>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl">
        {/* Sidebar — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 p-3">
            <div className="glass rounded-2xl shadow-card">
              <Sidebar role={role} />
            </div>
          </div>
        </aside>

        {/* Sidebar — mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-20 lg:hidden">
            <div
              className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="glass absolute left-0 top-16 h-full w-64 animate-fade-in shadow-2xl">
              <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
