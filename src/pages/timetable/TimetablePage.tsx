import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [cs, setCs] = useState<ClassSection>({ studentClass: '', section: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const ready = !!cs.studentClass && !!cs.section;

  const query = useQuery({
    queryKey: ['timetable', cs.studentClass, cs.section, includeArchived],
    queryFn: () => timetableApi.byClass(cs.studentClass, cs.section, includeArchived),
    enabled: ready,
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? timetableApi.archive(id) : timetableApi.restore(id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['timetable', cs.studentClass, cs.section] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  const { periods, grid } = useMemo(() => buildGrid(query.data ?? []), [query.data]);

  return (
    <div>
      <PageHeader
        title={t('pages.timetable.title')}
        description={t('pages.timetable.description')}
        action={
          isAdmin && ready ? <Button onClick={() => setModalOpen(true)}>{t('timetable.addEntry')}</Button> : undefined
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 p-4 sm:p-6">
          <ClassSectionPicker value={cs} onChange={setCs} />
          {isAdmin && (
            <label className="flex items-center gap-2 pb-1 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {t('common.showArchived')}
            </label>
          )}
        </div>
      </Card>

      {actionError && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {!ready ? (
        <EmptyState title={t('timetable.selectClassSection')} message={t('timetable.chooseAboveToView')} />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : periods.length === 0 ? (
        <EmptyState
          title={t('timetable.noEntries')}
          message={isAdmin ? t('timetable.addFirstEntry') : t('timetable.noTimetableSet')}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-50/80 to-accent-50/60">
                  <th className="border border-slate-100 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-brand-800/70">
                    {t('timetable.period')}
                  </th>
                  {WEEK.map((d) => (
                    <th
                      key={d}
                      className="border border-slate-100 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-brand-800/70"
                    >
                      {DAY_LABEL[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p} className="transition-colors hover:bg-brand-50/40">
                    <td className="border border-slate-100 px-3 py-2 font-bold text-brand-700">{p}</td>
                    {WEEK.map((d) => {
                      const entry = grid.get(`${d}|${p}`);
                      return (
                        <td key={d} className="border border-slate-100 px-3 py-2">
                          {entry ? (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                entry.active
                                  ? 'bg-brand-50 text-brand-700 ring-brand-100'
                                  : 'bg-slate-100 text-slate-500 ring-slate-200'
                              }`}
                            >
                              {entry.subject}
                              {!entry.active && <span className="text-[10px] uppercase">{t('common.archived')}</span>}
                              {isAdmin && (
                                <button
                                  type="button"
                                  title={entry.active ? t('common.archive') : t('common.restore')}
                                  disabled={archiveMutation.isPending && archiveMutation.variables?.id === entry.id}
                                  onClick={() => archiveMutation.mutate({ id: entry.id, active: entry.active })}
                                  className="ml-0.5 rounded-full px-1 text-current hover:bg-black/10 disabled:opacity-50"
                                >
                                  {entry.active ? '×' : '↺'}
                                </button>
                              )}
                            </span>
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
  const { t } = useTranslation();
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
      title={t('timetable.addTimetableEntry')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="tt-form" loading={mutation.isPending}>
            {t('timetable.add')}
          </Button>
        </>
      }
    >
      <form id="tt-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-500">
          {t('timetable.classPrefix')} <span className="font-medium text-slate-700">{defaults.studentClass}-{defaults.section}</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('timetable.day')}
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
            label={t('timetable.period')}
            type="number"
            min={1}
            max={12}
            required
            value={form.period}
            onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
          />
        </div>
        <Input
          label={t('timetable.subject')}
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <Select
          label={t('timetable.teacher')}
          required
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
        >
          <option value="">{t('timetable.selectTeacher')}</option>
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
