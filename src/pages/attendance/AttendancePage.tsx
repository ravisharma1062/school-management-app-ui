import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentsApi } from '@/api/students';
import { attendanceApi } from '@/api/attendance';
import { extractErrorMessage } from '@/api/client';
import { ATTENDANCE_STATUSES, todayIso } from '@/lib/format';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { AttendanceStatus, StudentDto } from '@/types';

const ROSTER_SIZE = 500;

export function AttendancePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [studentClass, setStudentClass] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(todayIso());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Full roster (teachers may list all students); we filter client-side.
  const rosterQuery = useQuery({
    queryKey: ['students', 'roster'],
    queryFn: () => studentsApi.list({ size: ROSTER_SIZE, sort: 'rollNo,asc' }),
  });

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    rosterQuery.data?.content.forEach((s) => set.add(s.studentClass));
    return Array.from(set).sort();
  }, [rosterQuery.data]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    rosterQuery.data?.content
      .filter((s) => !studentClass || s.studentClass === studentClass)
      .forEach((s) => set.add(s.section));
    return Array.from(set).sort();
  }, [rosterQuery.data, studentClass]);

  const roster: StudentDto[] = useMemo(() => {
    if (!studentClass || !section) return [];
    return (rosterQuery.data?.content ?? [])
      .filter((s) => s.studentClass === studentClass && s.section === section)
      .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  }, [rosterQuery.data, studentClass, section]);

  const canQuery = !!studentClass && !!section && !!date;

  // Existing attendance for the chosen class/section/date (to prefill).
  const existingQuery = useQuery({
    queryKey: ['attendance', 'class', studentClass, section, date],
    queryFn: () => attendanceApi.byClass(studentClass, section, date),
    enabled: canQuery,
  });

  // Seed the editable status map whenever roster/existing data changes.
  useEffect(() => {
    if (!canQuery) return;
    const existing = new Map(existingQuery.data?.map((a) => [a.studentId, a.status]) ?? []);
    const next: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => {
      next[s.id] = existing.get(s.id) ?? 'PRESENT';
    });
    setStatuses(next);
  }, [roster, existingQuery.data, canQuery]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        roster.map((s) =>
          attendanceApi.mark({ studentId: s.id, date, status: statuses[s.id] ?? 'PRESENT' }),
        ),
      );
    },
    onSuccess: () => {
      setBanner({ type: 'ok', text: `Attendance saved for ${roster.length} students.` });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => setBanner({ type: 'err', text: extractErrorMessage(err) }),
  });

  return (
    <div>
      <PageHeader title={t('pages.attendance.title')} description={t('pages.attendance.description')} />

      <Card className="mb-6">
        <CardBody>
          {rosterQuery.isLoading ? (
            <LoadingState label="Loading roster…" />
          ) : rosterQuery.isError ? (
            <ErrorState error={rosterQuery.error} onRetry={() => rosterQuery.refetch()} />
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <Select
                  label="Class"
                  value={studentClass}
                  onChange={(e) => {
                    setStudentClass(e.target.value);
                    setSection('');
                  }}
                >
                  <option value="">— Select —</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-40">
                <Select
                  label="Section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={!studentClass}
                >
                  <option value="">— Select —</option>
                  {sectionOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-48">
                <Input
                  label="Date"
                  type="date"
                  max={todayIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {banner && (
        <div
          role="status"
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            banner.type === 'ok'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {banner.text}
        </div>
      )}

      {!canQuery ? (
        <EmptyState title="Select a class, section and date" message="Choose above to load the roster." />
      ) : existingQuery.isLoading ? (
        <LoadingState />
      ) : roster.length === 0 ? (
        <EmptyState title="No students" message="No students found for this class and section." />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Roll no.</TH>
                <TH>Name</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {roster.map((s) => (
                <TR key={s.id}>
                  <TD>{s.rollNo}</TD>
                  <TD className="font-medium text-slate-900">{s.name}</TD>
                  <TD>
                    <div className="w-40">
                      <Select
                        aria-label={`Attendance status for ${s.name}`}
                        value={statuses[s.id] ?? 'PRESENT'}
                        onChange={(e) =>
                          setStatuses((prev) => ({ ...prev, [s.id]: e.target.value as AttendanceStatus }))
                        }
                      >
                        {ATTENDANCE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="flex justify-end border-t border-slate-100 px-4 py-3">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save attendance
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
