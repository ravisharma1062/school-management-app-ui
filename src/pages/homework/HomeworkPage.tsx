import { useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { homeworkApi } from '@/api/homework';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDate, todayIso } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Textarea,
} from '@/components/ui';
import { ClassSectionPicker, type ClassSection } from '@/components/features/ClassSectionPicker';
import { ParentSubmissionControl, TeacherSubmissionsPanel } from '@/components/features/HomeworkSubmissions';
import type { HomeworkCreateRequest } from '@/types';

const PAGE_SIZE = 10;

export function HomeworkPage() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const [cs, setCs] = useState<ClassSection>({ studentClass: '', section: '' });
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const ready = !!cs.studentClass && !!cs.section;

  const query = useQuery({
    queryKey: ['homework', cs.studentClass, cs.section, page],
    queryFn: () => homeworkApi.byClass(cs.studentClass, cs.section, { page, size: PAGE_SIZE, sort: 'dueDate,desc' }),
    enabled: ready,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title={t('pages.homework.title')}
        description={t('pages.homework.description')}
        action={
          isTeacher && ready ? <Button onClick={() => setModalOpen(true)}>{t('homework.postHomework')}</Button> : undefined
        }
      />

      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <ClassSectionPicker
            value={cs}
            onChange={(v) => {
              setCs(v);
              setPage(0);
            }}
          />
        </div>
      </Card>

      {!ready ? (
        <EmptyState title={t('homework.selectClassSection')} message={t('homework.chooseAboveToView')} />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState
          title={t('homework.noHomework')}
          message={isTeacher ? t('homework.postFirstAssignment') : t('homework.noHomeworkPosted')}
        />
      ) : (
        query.data && (
          <div className="space-y-3">
            {query.data.content.map((hw) => (
              <Card key={hw.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{hw.title}</h3>
                        <Badge tone="blue">{hw.subject}</Badge>
                      </div>
                      {hw.description && <p className="mt-1 text-sm text-slate-600">{hw.description}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{t('homework.due')}</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(hw.dueDate)}</p>
                    </div>
                  </div>
                  {isParent && <ParentSubmissionControl homeworkId={hw.id} cs={cs} />}
                  {isTeacher && <TeacherSubmissionsPanel homeworkId={hw.id} />}
                </CardBody>
              </Card>
            ))}
            <Pagination
              page={query.data.number}
              totalPages={query.data.totalPages}
              totalElements={query.data.totalElements}
              onPageChange={setPage}
            />
          </div>
        )
      )}

      {isTeacher && (
        <PostHomeworkModal open={modalOpen} onClose={() => setModalOpen(false)} defaults={cs} />
      )}
    </div>
  );
}

function PostHomeworkModal({
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
  const [form, setForm] = useState<Omit<HomeworkCreateRequest, 'studentClass' | 'section'>>({
    subject: '',
    title: '',
    description: '',
    dueDate: todayIso(),
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: HomeworkCreateRequest) => homeworkApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['homework', created.studentClass, created.section] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      ...form,
      description: form.description || undefined,
      studentClass: defaults.studentClass,
      section: defaults.section,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('homework.postHomeworkModal')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="hw-form" loading={mutation.isPending}>
            {t('homework.post')}
          </Button>
        </>
      }
    >
      <form id="hw-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-500">
          {t('homework.classPrefix')} <span className="font-medium text-slate-700">{defaults.studentClass}-{defaults.section}</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('homework.subject')}
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Input
            label={t('homework.dueDate')}
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <Input
          label={t('homework.title')}
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Textarea
          label={t('homework.description')}
          rows={4}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </form>
    </Modal>
  );
}
