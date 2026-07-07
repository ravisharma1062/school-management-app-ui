import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '@/api/timetable';
import { usersApi } from '@/api/users';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { DAYS_OF_WEEK } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
} from '@/components/ui';
import { ClassSectionPicker, type ClassSection } from '@/components/features/ClassSectionPicker';
import type { DayOfWeek, TimetableCreateRequest, TimetableDto } from '@/types';

const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

const WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function TimetablePage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [cs, setCs] = useState<ClassSection>({ studentClass: '', section: '' });
  const [modalOpen, setModalOpen] = useState(false);

  const ready = !!cs.studentClass && !!cs.section;

  const query = useQuery({
    queryKey: ['timetable', cs.studentClass, cs.section],
    queryFn: () => timetableApi.byClass(cs.studentClass, cs.section),
    enabled: ready,
  });

  const { periods, grid } = useMemo(() => buildGrid(query.data ?? []), [query.data]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly class timetable."
        action={
          isAdmin && ready ? <Button onClick={() => setModalOpen(true)}>+ Add entry</Button> : undefined
        }
      />

      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <ClassSectionPicker value={cs} onChange={setCs} />
        </div>
      </Card>

      {!ready ? (
        <EmptyState title="Select a class and section" message="Choose above to view the timetable." />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : periods.length === 0 ? (
        <EmptyState
          title="No timetable entries"
          message={isAdmin ? 'Add the first entry for this class.' : 'No timetable has been set for this class yet.'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                    Period
                  </th>
                  {WEEK.map((d) => (
                    <th
                      key={d}
                      className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500"
                    >
                      {DAY_LABEL[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p}>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{p}</td>
                    {WEEK.map((d) => {
                      const entry = grid.get(`${d}|${p}`);
                      return (
                        <td key={d} className="border border-slate-200 px-3 py-2">
                          {entry ? (
                            <span className="font-medium text-slate-900">{entry.subject}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isAdmin && (
        <AddTimetableModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          defaults={cs}
        />
      )}
    </div>
  );
}

function buildGrid(entries: TimetableDto[]) {
  const grid = new Map<string, TimetableDto>();
  const periodSet = new Set<number>();
  entries.forEach((e) => {
    grid.set(`${e.dayOfWeek}|${e.period}`, e);
    periodSet.add(e.period);
  });
  const periods = Array.from(periodSet).sort((a, b) => a - b);
  return { periods, grid };
}

function AddTimetableModal({
  open,
  onClose,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  defaults: ClassSection;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TimetableCreateRequest>({
    studentClass: defaults.studentClass,
    section: defaults.section,
    dayOfWeek: 'MONDAY',
    period: 1,
    subject: '',
    teacherId: '',
  });
  const [error, setError] = useState<string | null>(null);

  const teachersQuery = useQuery({
    queryKey: ['users', 'TEACHER', 'all'],
    queryFn: () => usersApi.list({ role: 'TEACHER', size: 200 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (payload: TimetableCreateRequest) => timetableApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['timetable', created.studentClass, created.section] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ ...form, studentClass: defaults.studentClass, section: defaults.section });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add timetable entry"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="tt-form" loading={mutation.isPending}>
            Add entry
          </Button>
        </>
      }
    >
      <form id="tt-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-500">
          Class <span className="font-medium text-slate-700">{defaults.studentClass}-{defaults.section}</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Day"
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value as DayOfWeek })}
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Input
            label="Period"
            type="number"
            min={1}
            max={12}
            required
            value={form.period}
            onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
          />
        </div>
        <Input
          label="Subject"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <Select
          label="Teacher"
          required
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
        >
          <option value="">— Select teacher —</option>
          {teachersQuery.data?.content.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
