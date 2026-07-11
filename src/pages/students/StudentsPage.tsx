import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '@/api/students';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { StudentFormModal } from './StudentFormModal';
import type { BulkImportResult } from '@/types';

const PAGE_SIZE = 10;

export function StudentsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '', rollNo: '', studentClass: '' });
  const [includeArchived, setIncludeArchived] = useState(false);

  const query = useQuery({
    queryKey: ['students', page, filters, includeArchived],
    queryFn: () =>
      studentsApi.list({
        page,
        size: PAGE_SIZE,
        sort: 'name,asc',
        name: filters.name || undefined,
        rollNo: filters.rollNo || undefined,
        studentClass: filters.studentClass || undefined,
        includeArchived,
      }),
    placeholderData: keepPreviousData,
  });

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description="School-wide student directory."
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Button onClick={() => setModalOpen(true)}>+ Add student</Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Input
            label="Name"
            placeholder="Search by name"
            value={filters.name}
            onChange={(e) => updateFilter('name', e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            label="Roll no."
            placeholder="Search by roll no."
            value={filters.rollNo}
            onChange={(e) => updateFilter('rollNo', e.target.value)}
          />
        </div>
        <div className="w-32">
          <Input
            label="Class"
            placeholder="e.g. 9"
            value={filters.studentClass}
            onChange={(e) => updateFilter('studentClass', e.target.value)}
          />
        </div>
        {isAdmin && (
          <label className="mb-2.5 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Show archived
          </label>
        )}
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState
          title="No students found"
          message={isAdmin ? 'Add a student or adjust your filters.' : 'No students match your filters.'}
          action={isAdmin ? <Button onClick={() => setModalOpen(true)}>+ Add student</Button> : undefined}
        />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Roll no.</TH>
                  <TH>Class</TH>
                  <TH>Section</TH>
                  <TH>Date of birth</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {query.data.content.map((s) => (
                  <TR key={s.id} className="hover:bg-slate-50">
                    <TD className="font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {s.name}
                        {!s.active && <Badge tone="gray">Archived</Badge>}
                      </span>
                    </TD>
                    <TD>{s.rollNo}</TD>
                    <TD>{s.studentClass}</TD>
                    <TD>{s.section}</TD>
                    <TD>{formatDate(s.dob)}</TD>
                    <TD className="text-right">
                      <Link to={`/students/${s.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        View
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-slate-100 px-4">
              <Pagination
                page={query.data.number}
                totalPages={query.data.totalPages}
                totalElements={query.data.totalElements}
                onPageChange={setPage}
              />
            </div>
          </Card>
        )
      )}

      {isAdmin && <StudentFormModal open={modalOpen} onClose={() => setModalOpen(false)} />}
      {isAdmin && <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (f: File) => studentsApi.bulkImport(f),
    onSuccess: (res) => {
      setResult(res);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    mutation.mutate(file);
  }

  function close() {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import students from CSV"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={close}>
            Close
          </Button>
          <Button type="submit" form="bulk-import-form" loading={mutation.isPending} disabled={!file}>
            Import
          </Button>
        </>
      }
    >
      <form id="bulk-import-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-slate-500">
          Header row: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">name,rollNo,studentClass,section,dob,parentEmail</code>
          . <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">parentEmail</code> is optional; dates use{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">yyyy-MM-dd</code>.
        </p>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input type="file" accept=".csv,text/csv" onChange={onFileChange} />

        {result && (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              {result.successCount} of {result.totalRows} row{result.totalRows === 1 ? '' : 's'} imported
              {result.failureCount > 0 && `, ${result.failureCount} failed`}.
            </p>
            {result.errors.length > 0 && (
              <Table>
                <THead>
                  <TR>
                    <TH>Row</TH>
                    <TH>Error</TH>
                  </TR>
                </THead>
                <TBody>
                  {result.errors.map((e) => (
                    <TR key={e.row}>
                      <TD>{e.row}</TD>
                      <TD className="text-red-600">{e.message}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
