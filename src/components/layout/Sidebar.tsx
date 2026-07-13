import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/context/SubscriptionContext';
import { navFor } from './nav';
import type { Role } from '@/types';

export function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { isEntitled } = useSubscription();
  const items = navFor(role, isEntitled);
  return (
    <nav className="stagger flex flex-col gap-1.5 p-3" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-glow'
                : 'text-slate-600 hover:translate-x-1 hover:bg-brand-50 hover:text-brand-700'
            }`
          }
        >
          <span
            aria-hidden="true"
            className="text-lg transition-transform duration-200 group-hover:scale-110"
          >
            {item.icon}
          </span>
          {t(`nav.${item.labelKey}`)}
        </NavLink>
      ))}
    </nav>
  );
}
