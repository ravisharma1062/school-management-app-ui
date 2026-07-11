import { useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveRequestsApi } from '@/api/leaveRequests';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDate, LEAVE_TYPES, todayIso } from '@/lib/format';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  LeaveStatusBadge,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '@/components/ui';
import type { LeaveRequestCreateRequest, LeaveStatus, LeaveType } from '@/types';

const PAGE_SIZE = 10;

export function LeaveRequestsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leave-requests', statusFilter, page],
    queryFn: () =>
      leaveRequestsApi.list({ page, size: PAGE_SIZE, sort: 'createdAt,desc', status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      leaveRequestsApi.review(id, { status }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description={isAdmin ? 'Review and approve leave requests.' : 'Submit and track your leave requests.'}
      />

      {!isAdmin && <RequestLeaveForm />}

      <div className="mb-4 mt-6 flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm text-slate-600">
          Status
        </label>
        <div className="w-44">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeaveStatus | '');
              setPage(0);
            }}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState
          title="No leave requests"
          message={isAdmin ? 'Nothing to review right now.' : "You haven't submitted any leave requests yet."}
        />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Type</TH>
                  <TH>From</TH>
                  <TH>To</TH>
                  <TH>Reason</TH>
                  <TH>Status</TH>
                  {isAdmin && <TH className="text-right">Actions</TH>}
                </TR>
              </THead>
              <TBody>
                {query.data.content.map((r) => (
                  <TR key={r.id}>
                    <TD>{r.type}</TD>
                    <TD>{formatDate(r.fromDate)}</TD>
                    <TD>{formatDate(r.toDate)}</TD>
                    <TD className="max-w-xs truncate">{r.reason || '—'}</TD>
                    <TD>
                      <LeaveStatusBadge status={r.status} />
                    </TD>
                    {isAdmin && (
                      <TD className="text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              loading={
                                reviewMutation.isPending &&
                                reviewMutation.variables?.id === r.id &&
                                reviewMutation.variables.status === 'APPROVED'
                              }
                              onClick={() => reviewMutation.mutate({ id: r.id, status: 'APPROVED' })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={
                                reviewMutation.isPending &&
                                reviewMutation.variables?.id === r.id &&
                                reviewMutation.variables.status === 'REJECTED'
                              }
                              onClick={() => reviewMutation.mutate({ id: r.id, status: 'REJECTED' })}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TD>
                    )}
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
    </div>
  );
}

const emptyForm: LeaveRequestCreateRequest = {
  type: 'CASUAL',
  fromDate: todayIso(),
  toDate: todayIso(),
  reason: '',
};

function RequestLeaveForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LeaveRequestCreateRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: LeaveRequestCreateRequest) => leaveRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setForm(emptyForm);
      setSuccess(true);
      setError(null);
    },
    onError: (err) => {
      setError(extractErrorMessage(err));
      setSuccess(false);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    mutation.mutate({ ...form, reason: form.reason || undefined });
  }

  return (
    <Card>
      <CardBody>
        <h2 className="mb-4 text-sm font-bold text-slate-900">Submit a leave request</h2>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="animate-scale-in rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
              Leave request submitted.
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">From</span>
              <input
                type="date"
                required
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="block w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">To</span>
              <input
                type="date"
                required
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="block w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </label>
          </div>
          <Textarea
            label="Reason (optional)"
            rows={3}
            value={form.reason ?? ''}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending}>
              Submit request
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
