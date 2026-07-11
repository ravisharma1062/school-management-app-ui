import type { AttendanceStatus, DayOfWeek, FeeStatus, LeaveType, Role, TargetRole } from '@/types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const ROLES: Role[] = ['ADMIN', 'TEACHER', 'PARENT'];
export const TARGET_ROLES: TargetRole[] = ['ALL', 'ADMIN', 'TEACHER', 'PARENT'];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
export const FEE_STATUSES: FeeStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'];
export const LEAVE_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'OTHER'];
export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
