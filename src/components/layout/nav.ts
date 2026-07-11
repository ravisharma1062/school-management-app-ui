import type { Role } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  icon: string; // simple emoji glyph to avoid an icon dependency
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🏠' },
  { to: '/students', label: 'Students', roles: ['ADMIN', 'TEACHER'], icon: '🎓' },
  { to: '/children', label: 'My Children', roles: ['PARENT'], icon: '🎓' },
  { to: '/attendance', label: 'Attendance', roles: ['TEACHER'], icon: '📋' },
  { to: '/timetable', label: 'Timetable', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🗓️' },
  { to: '/homework', label: 'Homework', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📚' },
  { to: '/notices', label: 'Notices', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📢' },
  { to: '/leave-requests', label: 'Leave Requests', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🏖️' },
  { to: '/events', label: 'Events', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🎉' },
  { to: '/library', label: 'Library', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📖' },
  { to: '/messages', label: 'Messages', roles: ['TEACHER', 'PARENT'], icon: '💬' },
  { to: '/users', label: 'Users', roles: ['ADMIN'], icon: '👥' },
  { to: '/notification-preferences', label: 'Notifications', roles: ['ADMIN'], icon: '🔔' },
  { to: '/analytics', label: 'Analytics', roles: ['ADMIN'], icon: '📊' },
  { to: '/bus-routes', label: 'Bus Routes', roles: ['ADMIN'], icon: '🚌' },
];

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
