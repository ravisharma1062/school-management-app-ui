import type { ReactNode } from 'react';
import type { AttendanceStatus, BookIssueStatus, FeeStatus, HomeworkSubmissionStatus, LeaveStatus } from '@/types';

type Tone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const dots: Record<Tone, string> = {
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-sky-500',
  purple: 'bg-purple-500',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
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

const leaveTone: Record<LeaveStatus, Tone> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return <Badge tone={leaveTone[status]}>{status}</Badge>;
}

const homeworkSubmissionTone: Record<HomeworkSubmissionStatus, Tone> = {
  SUBMITTED: 'blue',
  GRADED: 'green',
};

export function HomeworkSubmissionBadge({ status }: { status: HomeworkSubmissionStatus }) {
  return <Badge tone={homeworkSubmissionTone[status]}>{status}</Badge>;
}

const bookIssueTone: Record<BookIssueStatus, Tone> = {
  ISSUED: 'blue',
  RETURNED: 'green',
};

export function BookIssueBadge({ status }: { status: BookIssueStatus }) {
  return <Badge tone={bookIssueTone[status]}>{status}</Badge>;
}
