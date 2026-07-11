import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '@/api/library';
import { extractErrorMessage } from '@/api/client';
import { formatDate, formatMoney } from '@/lib/format';
import { BookIssueBadge, Button, EmptyState, ErrorState, LoadingState, Table, TBody, TD, TH, THead, TR } from '@/components/ui';

export function LibraryPanel({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['library-issues', studentId],
    queryFn: () => libraryApi.getIssuesForStudent(studentId),
  });

  const returnMutation = useMutation({
    mutationFn: (issueId: string) => libraryApi.returnBook(issueId),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['library-issues', studentId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || query.data.length === 0) {
    return <EmptyState title="No books issued" message="This student has no library history yet." />;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <Table>
        <THead>
          <TR>
            <TH>Book</TH>
            <TH>Issued</TH>
            <TH>Due</TH>
            <TH>Returned</TH>
            <TH>Fine</TH>
            <TH>Status</TH>
            {canManage && <TH className="text-right">Actions</TH>}
          </TR>
        </THead>
        <TBody>
          {query.data.map((issue) => (
            <TR key={issue.id}>
              <TD className="font-medium text-slate-900">{issue.bookTitle}</TD>
              <TD>{formatDate(issue.issuedAt)}</TD>
              <TD>{formatDate(issue.dueDate)}</TD>
              <TD>{formatDate(issue.returnedAt)}</TD>
              <TD>{issue.fineAmount ? formatMoney(issue.fineAmount) : '—'}</TD>
              <TD>
                <BookIssueBadge status={issue.status} />
              </TD>
              {canManage && (
                <TD className="text-right">
                  {issue.status === 'ISSUED' && (
                    <Button
                      variant="secondary"
                      loading={returnMutation.isPending && returnMutation.variables === issue.id}
                      onClick={() => returnMutation.mutate(issue.id)}
                    >
                      Return
                    </Button>
                  )}
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
