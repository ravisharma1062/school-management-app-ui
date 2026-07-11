import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { attendanceApi } from '@/api/attendance';
import { formatDate } from '@/lib/format';
import {
  AttendanceBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { AttendanceDto } from '@/types';

function percentage(records: AttendanceDto[]): number {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  return (present * 100) / records.length;
}

export function AttendancePanel({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => attendanceApi.byStudent(studentId),
  });

  const pct = useMemo(() => (query.data ? percentage(query.data) : 0), [query.data]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || query.data.length === 0)
    return <EmptyState title={t('attendancePanel.noAttendanceRecords')} message={t('attendancePanel.notMarkedYet')} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50/60 px-5 py-4 ring-1 ring-inset ring-brand-100">
        <div>
          <p className="text-gradient text-2xl font-extrabold">{pct.toFixed(1)}%</p>
          <p className="text-xs font-medium text-slate-500">{t('attendancePanel.presentLate')}</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{query.data.length}</p>
          <p className="text-xs font-medium text-slate-500">{t('attendancePanel.daysRecorded')}</p>
        </div>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>{t('attendancePanel.date')}</TH>
            <TH>{t('attendancePanel.status')}</TH>
          </TR>
        </THead>
        <TBody>
          {query.data.map((a) => (
            <TR key={a.id}>
              <TD>{formatDate(a.date)}</TD>
              <TD>
                <AttendanceBadge status={a.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
