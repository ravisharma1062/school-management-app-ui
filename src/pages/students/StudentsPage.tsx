import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/api/students';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
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

const PAGE_SIZE = 10;

export function StudentsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const query = useQuery({
    queryKey: ['students', page],
    queryFn: () => studentsApi.list({ page, size: PAGE_SIZE, sort: 'name,asc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title="Students"
        description="School-wide student directory."
        action={
          isAdmin ? (
            <Button onClick={() => setModalOpen(true)}>+ Add student</Button>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState
          title="No students yet"
          message={isAdmin ? 'Add your first student to get started.' : 'No students are registered yet.'}
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
                    <TD className="font-medium text-slate-900">{s.name}</TD>
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
    </div>
  );
}
