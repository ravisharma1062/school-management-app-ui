import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { navFor } from '@/components/layout/nav';

const greetingByRole: Record<string, string> = {
  ADMIN: 'Manage students, staff, timetables and school-wide notices.',
  TEACHER: 'Mark attendance, post homework, and record exam results.',
  PARENT: "Follow your child's attendance, homework, results and fees.",
};

/** Per-route gradient so each quick-link card gets its own colour identity. */
const cardGradients: Record<string, string> = {
  '/students': 'from-indigo-500 to-violet-500',
  '/children': 'from-indigo-500 to-violet-500',
  '/attendance': 'from-emerald-500 to-teal-500',
  '/timetable': 'from-sky-500 to-cyan-500',
  '/homework': 'from-amber-500 to-orange-500',
  '/notices': 'from-rose-500 to-pink-500',
  '/users': 'from-fuchsia-500 to-purple-500',
};

function HeroIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-28 w-40 sm:h-36 sm:w-52" aria-hidden="true">
      <circle cx="164" cy="30" r="16" fill="#fde68a" className="animate-float-slow" />
      <g className="animate-float">
        <rect x="34" y="46" width="110" height="74" rx="10" fill="white" opacity="0.95" />
        <path d="M30 48l59-30 59 30z" fill="#e0e7ff" />
        <rect x="76" y="86" width="22" height="34" rx="4" fill="#6366f1" />
        <rect x="46" y="64" width="18" height="16" rx="3" fill="#c7d2fe" />
        <rect x="112" y="64" width="18" height="16" rx="3" fill="#c7d2fe" />
        <circle cx="88" cy="52" r="8" fill="white" stroke="#818cf8" strokeWidth="2.5" />
        <path d="M88 48v4l3 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="animate-float-slow">
        <rect x="150" y="76" width="34" height="26" rx="6" fill="#f0abfc" />
        <path d="M156 85h22M156 92h15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="animate-float">
        <circle cx="22" cy="78" r="14" fill="#7dd3fc" />
        <path d="M16 78l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function DashboardPage() {
  const { user, role } = useAuth();
  if (!role) return null;

  const links = navFor(role).filter((i) => i.to !== '/dashboard');
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      {/* Hero banner */}
      <div className="relative mb-8 animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-accent-600 p-6 shadow-glow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 right-24 h-48 w-48 animate-blob rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 animate-blob-slow rounded-full bg-accent-400/30 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">Dashboard</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="mt-2 max-w-xl text-brand-100">{greetingByRole[role]}</p>
          </div>
          <HeroIllustration />
        </div>
      </div>

      {/* Quick links */}
      <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
              <div
                aria-hidden="true"
                className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${
                  cardGradients[item.to] ?? 'from-brand-500 to-accent-500'
                } opacity-10 transition-all duration-300 group-hover:scale-[1.8] group-hover:opacity-20`}
              />
              <div className="relative flex items-center gap-4">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    cardGradients[item.to] ?? 'from-brand-500 to-accent-500'
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">Go to {item.label.toLowerCase()}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="ml-auto text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-500"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
