import { useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/users';
import { extractErrorMessage } from '@/api/client';
import { ROLES } from '@/lib/format';
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
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { Role, UserCreateRequest } from '@/types';

const PAGE_SIZE = 10;

const roleTone: Record<Role, 'purple' | 'blue' | 'green'> = {
  ADMIN: 'purple',
  TEACHER: 'blue',
  PARENT: 'green',
};

export function UsersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [modalOpen, setModalOpen] = useState(false);

  const query = useQuery({
    queryKey: ['users', roleFilter, page],
    queryFn: () =>
      usersApi.list({ page, size: PAGE_SIZE, sort: 'name,asc', role: roleFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title={t('pages.users.title')}
        description={t('pages.users.description')}
        action={<Button onClick={() => setModalOpen(true)}>+ Add user</Button>}
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="role-filter" className="text-sm text-slate-600">
          Filter by role
        </label>
        <div className="w-48">
          <Select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | '');
              setPage(0);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
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
        <EmptyState title="No users found" message="Try a different filter or add a new user." />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Phone</TH>
                </TR>
              </THead>
              <TBody>
                {query.data.content.map((u) => (
                  <TR key={u.id} className="hover:bg-slate-50">
                    <TD className="font-medium text-slate-900">{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge tone={roleTone[u.role]}>{u.role}</Badge>
                    </TD>
                    <TD>{u.phone || '—'}</TD>
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

      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

const emptyUser: UserCreateRequest = {
  name: '',
  email: '',
  password: '',
  role: 'TEACHER',
  phone: '',
};

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserCreateRequest>(emptyUser);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: UserCreateRequest) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm(emptyUser);
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ ...form, phone: form.phone || undefined });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add user"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={mutation.isPending}>
            Create user
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Full name"
          required
          maxLength={150}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Input
            label="Phone"
            maxLength={20}
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <p className="text-xs text-slate-500">Password must be at least 8 characters.</p>
      </form>
    </Modal>
  );
}
