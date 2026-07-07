import { useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { noticesApi } from '@/api/notices';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { TARGET_ROLES, formatDateTime } from '@/lib/format';
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
  Select,
  Textarea,
} from '@/components/ui';
import type { NoticeCreateRequest, TargetRole } from '@/types';

const PAGE_SIZE = 10;

export function NoticesPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<TargetRole | ''>('');
  const [modalOpen, setModalOpen] = useState(false);

  const query = useQuery({
    queryKey: ['notices', filter, page],
    queryFn: () =>
      noticesApi.list({ page, size: PAGE_SIZE, sort: 'createdAt,desc', role: filter || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title="Notices"
        description="School announcements."
        action={isAdmin ? <Button onClick={() => setModalOpen(true)}>+ Post notice</Button> : undefined}
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="notice-filter" className="text-sm text-slate-600">
          Audience
        </label>
        <div className="w-48">
          <Select
            id="notice-filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as TargetRole | '');
              setPage(0);
            }}
          >
            <option value="">All visible</option>
            {TARGET_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState title="No notices" message="There are no announcements to show." />
      ) : (
        query.data && (
          <div className="space-y-3">
            {query.data.content.map((n) => (
              <Card key={n.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{n.title}</h3>
                        <Badge tone="purple">{n.targetRole}</Badge>
                      </div>
                      {n.description && <p className="mt-1 text-sm text-slate-600">{n.description}</p>}
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                  </div>
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

      {isAdmin && <PostNoticeModal open={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const emptyNotice: NoticeCreateRequest = { title: '', description: '', targetRole: 'ALL' };

function PostNoticeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NoticeCreateRequest>(emptyNotice);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: NoticeCreateRequest) => noticesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setForm(emptyNotice);
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ ...form, description: form.description || undefined });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Post notice"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="notice-form" loading={mutation.isPending}>
            Post notice
          </Button>
        </>
      }
    >
      <form id="notice-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Select
          label="Audience"
          required
          value={form.targetRole}
          onChange={(e) => setForm({ ...form, targetRole: e.target.value as TargetRole })}
        >
          {TARGET_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Textarea
          label="Description"
          rows={4}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </form>
    </Modal>
  );
}
