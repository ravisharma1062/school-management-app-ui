import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentsApi } from '@/api/students';
import { homeworkSubmissionsApi } from '@/api/homeworkSubmissions';
import { extractErrorMessage } from '@/api/client';
import { Button, HomeworkSubmissionBadge, LoadingState, Textarea } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { ClassSection } from '@/components/features/ClassSectionPicker';
import type { HomeworkSubmissionDto } from '@/types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** For a PARENT: shows submission status for their child(ren) in this class/section, or a file picker if not yet submitted. */
export function ParentSubmissionControl({ homeworkId, cs }: { homeworkId: string; cs: ClassSection }) {
  const childrenQuery = useQuery({
    queryKey: ['my-children'],
    queryFn: () => studentsApi.myChildren(),
  });

  const matchingChildren = (childrenQuery.data ?? []).filter(
    (c) => c.studentClass === cs.studentClass && c.section === cs.section,
  );

  if (childrenQuery.isLoading) return null;
  if (matchingChildren.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {matchingChildren.map((child) => (
        <ChildSubmissionRow key={child.id} homeworkId={homeworkId} studentId={child.id} studentName={child.name} />
      ))}
    </div>
  );
}

function ChildSubmissionRow({
  homeworkId,
  studentId,
  studentName,
}: {
  homeworkId: string;
  studentId: string;
  studentName: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ['homework-submissions', studentId],
    queryFn: () => homeworkSubmissionsApi.byStudent(studentId),
  });

  const submitMutation = useMutation({
    mutationFn: (file: File) => homeworkSubmissionsApi.submit(homeworkId, studentId, file),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['homework-submissions', studentId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const downloadMutation = useMutation({
    mutationFn: (submission: HomeworkSubmissionDto) => homeworkSubmissionsApi.downloadFile(submission.id),
    onSuccess: (blob, submission) => downloadBlob(blob, submission.fileName),
  });

  if (submissionsQuery.isLoading) return <LoadingState />;

  const submission = submissionsQuery.data?.find((s) => s.homeworkId === homeworkId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-medium text-slate-700">{studentName}</span>
      {error && <span className="w-full text-xs font-medium text-red-600">{error}</span>}
      {submission ? (
        <div className="flex items-center gap-3">
          <HomeworkSubmissionBadge status={submission.status} />
          {submission.grade && <span className="text-slate-600">{t('homeworkSubmissions.grade')}: {submission.grade}</span>}
          <button
            className="font-medium text-brand-600 hover:text-brand-700"
            onClick={() => downloadMutation.mutate(submission)}
          >
            {t('homeworkSubmissions.viewFile')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) submitMutation.mutate(file);
            }}
            disabled={submitMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}

/** For a TEACHER: expandable list of submissions for a homework item, with grading. */
export function TeacherSubmissionsPanel({ homeworkId }: { homeworkId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('homeworkSubmissions.hideSubmissions') : t('homeworkSubmissions.viewSubmissions')}
      </button>
      {open && <SubmissionsList homeworkId={homeworkId} />}
    </div>
  );
}

function SubmissionsList({ homeworkId }: { homeworkId: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['homework-submissions-by-hw', homeworkId],
    queryFn: () => homeworkSubmissionsApi.byHomework(homeworkId),
  });

  const downloadMutation = useMutation({
    mutationFn: (submission: HomeworkSubmissionDto) => homeworkSubmissionsApi.downloadFile(submission.id),
    onSuccess: (blob, submission) => downloadBlob(blob, submission.fileName),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <p className="mt-2 text-sm text-red-600">{t('homeworkSubmissions.couldNotLoad')}</p>;
  if (!query.data || query.data.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">{t('homeworkSubmissions.noSubmissionsYet')}</p>;
  }

  return (
    <div className="mt-2 space-y-3">
      {query.data.map((submission) => (
        <SubmissionRow
          key={submission.id}
          submission={submission}
          onDownload={() => downloadMutation.mutate(submission)}
        />
      ))}
    </div>
  );
}

function SubmissionRow({
  submission,
  onDownload,
}: {
  submission: HomeworkSubmissionDto;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.teacherFeedback ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => homeworkSubmissionsApi.grade(submission.id, { grade, teacherFeedback: feedback || undefined }),
    onSuccess: () => {
      setError(null);
      setGrading(false);
      queryClient.invalidateQueries({ queryKey: ['homework-submissions-by-hw', submission.homeworkId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <StudentLabel studentId={submission.studentId} />
          <HomeworkSubmissionBadge status={submission.status} />
          <span className="text-xs text-slate-400">{formatDateTime(submission.submittedAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button className="font-medium text-brand-600 hover:text-brand-700" onClick={onDownload}>
            {t('homeworkSubmissions.viewFile')}
          </button>
          <button className="font-medium text-brand-600 hover:text-brand-700" onClick={() => setGrading((v) => !v)}>
            {submission.status === 'GRADED' ? t('homeworkSubmissions.editGrade') : t('homeworkSubmissions.grade')}
          </button>
        </div>
      </div>

      {submission.status === 'GRADED' && !grading && (
        <p className="mt-2 text-sm text-slate-600">
          {t('homeworkSubmissions.grade')}: <span className="font-medium">{submission.grade}</span>
          {submission.teacherFeedback && <> — {submission.teacherFeedback}</>}
        </p>
      )}

      {grading && (
        <form onSubmit={onSubmit} className="mt-3 space-y-3" noValidate>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <div className="flex items-end gap-3">
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-slate-600">{t('homeworkSubmissions.grade')}</label>
              <input
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <Button type="submit" loading={mutation.isPending}>
              {t('homeworkSubmissions.save')}
            </Button>
          </div>
          <Textarea
            label={t('homeworkSubmissions.feedback')}
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </form>
      )}
    </div>
  );
}

function StudentLabel({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId),
  });
  return <span className="font-medium text-slate-800">{query.data?.name ?? t('homeworkSubmissions.student')}</span>;
}
