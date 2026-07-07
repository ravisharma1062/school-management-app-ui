import { NavLink } from 'react-router-dom';
import { navFor } from './nav';
import type { Role } from '@/types';

export function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const items = navFor(role);
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <span aria-hidden="true" className="text-base">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
