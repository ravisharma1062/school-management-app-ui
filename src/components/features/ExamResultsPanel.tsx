import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examResultsApi } from '@/api/examResults';
import { extractErrorMessage } from '@/api/client';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { ExamResultCreateRequest } from '@/types';

export function ExamResultsPanel({
  studentId,
  canRecord,
}: {
  studentId: string;
  canRecord: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['exam-results', studentId],
    queryFn: () => examResultsApi.byStudent(studentId),
  });

  const downloadMutation = useMutation({
    mutationFn: () => examResultsApi.downloadReportCard(studentId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'report-card.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (err) => setDownloadError(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
        <Button
          size="sm"
          variant="secondary"
          loading={downloadMutation.isPending}
          onClick={() => {
            setDownloadError(null);
            downloadMutation.mutate();
          }}
        >
          Download report card
        </Button>
        {canRecord && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Record result
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState title="No exam results" message="No results have been recorded for this student yet." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Term</TH>
              <TH>Exam</TH>
              <TH>Subject</TH>
              <TH>Marks</TH>
              <TH>Grade</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.map((r) => (
              <TR key={r.id}>
                <TD>{r.term}</TD>
                <TD>{r.examName}</TD>
                <TD>{r.subject}</TD>
                <TD>
                  {r.marksObtained} / {r.maxMarks}
                </TD>
                <TD>
                  <Badge tone="blue">{r.grade}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {canRecord && (
        <RecordResultModal
          studentId={studentId}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

const emptyForm = { subject: '', examName: '', term: '', marksObtained: '', maxMarks: '' };

function RecordResultModal({
  studentId,
  open,
  onClose,
}: {
  studentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: ExamResultCreateRequest) => examResultsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', studentId] });
      setForm(emptyForm);
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      studentId,
      subject: form.subject,
      examName: form.examName,
      term: form.term,
      marksObtained: Number(form.marksObtained),
      maxMarks: Number(form.maxMarks),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record exam result"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="result-form" loading={mutation.isPending}>
            Save result
          </Button>
        </>
      }
    >
      <form id="result-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Term"
            required
            placeholder="e.g. Term 1"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
          />
          <Input
            label="Exam name"
            required
            placeholder="e.g. Midterm"
            value={form.examName}
            onChange={(e) => setForm({ ...form, examName: e.target.value })}
          />
        </div>
        <Input
          label="Subject"
          required
          placeholder="e.g. Mathematics"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Marks obtained"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.marksObtained}
            onChange={(e) => setForm({ ...form, marksObtained: e.target.value })}
          />
          <Input
            label="Max marks"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.maxMarks}
            onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
          />
        </div>
        <p className="text-xs text-slate-500">The letter grade is computed automatically by the server.</p>
      </form>
    </Modal>
  );
}
