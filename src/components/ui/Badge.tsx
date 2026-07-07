import type { ReactNode } from 'react';
import type { AttendanceStatus, FeeStatus } from '@/types';

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const attendanceTone: Record<AttendanceStatus, Tone> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'yellow',
  EXCUSED: 'blue',
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return <Badge tone={attendanceTone[status]}>{status}</Badge>;
}

const feeTone: Record<FeeStatus, Tone> = {
  PAID: 'green',
  PARTIAL: 'yellow',
  PENDING: 'gray',
  OVERDUE: 'red',
};

export function FeeBadge({ status }: { status: FeeStatus }) {
  return <Badge tone={feeTone[status]}>{status}</Badge>;
}
