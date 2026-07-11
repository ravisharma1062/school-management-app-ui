import type { Role } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  labelKey: string; // i18next key under "nav"
  roles: Role[];
  icon: string; // simple emoji glyph to avoid an icon dependency
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', labelKey: 'dashboard', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🏠' },
  { to: '/students', label: 'Students', labelKey: 'students', roles: ['ADMIN', 'TEACHER'], icon: '🎓' },
  { to: '/children', label: 'My Children', labelKey: 'children', roles: ['PARENT'], icon: '🎓' },
  { to: '/attendance', label: 'Attendance', labelKey: 'attendance', roles: ['TEACHER'], icon: '📋' },
  { to: '/timetable', label: 'Timetable', labelKey: 'timetable', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🗓️' },
  { to: '/homework', label: 'Homework', labelKey: 'homework', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📚' },
  { to: '/notices', label: 'Notices', labelKey: 'notices', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📢' },
  { to: '/leave-requests', label: 'Leave Requests', labelKey: 'leaveRequests', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🏖️' },
  { to: '/events', label: 'Events', labelKey: 'events', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '🎉' },
  { to: '/library', label: 'Library', labelKey: 'library', roles: ['ADMIN', 'TEACHER', 'PARENT'], icon: '📖' },
  { to: '/messages', label: 'Messages', labelKey: 'messages', roles: ['TEACHER', 'PARENT'], icon: '💬' },
  { to: '/users', label: 'Users', labelKey: 'users', roles: ['ADMIN'], icon: '👥' },
  { to: '/notification-preferences', label: 'Notifications', labelKey: 'notificationPreferences', roles: ['ADMIN'], icon: '🔔' },
  { to: '/analytics', label: 'Analytics', labelKey: 'analytics', roles: ['ADMIN'], icon: '📊' },
  { to: '/bus-routes', label: 'Bus Routes', labelKey: 'busRoutes', roles: ['ADMIN'], icon: '🚌' },
];

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
