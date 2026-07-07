import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const query = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => attendanceApi.byStudent(studentId),
  });

  const pct = useMemo(() => (query.data ? percentage(query.data) : 0), [query.data]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || query.data.length === 0)
    return <EmptyState title="No attendance records" message="Attendance has not been marked for this student yet." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-lg bg-slate-50 px-4 py-3">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{pct.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Attendance (present + late)</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{query.data.length}</p>
          <p className="text-xs text-slate-500">Days recorded</p>
        </div>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Status</TH>
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
