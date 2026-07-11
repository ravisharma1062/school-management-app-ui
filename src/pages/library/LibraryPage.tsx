import { useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { libraryApi } from '@/api/library';
import { studentsApi } from '@/api/students';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import {
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
import type { BookDto } from '@/types';

const PAGE_SIZE = 10;

export function LibraryPage() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [issueBook, setIssueBook] = useState<BookDto | null>(null);

  const query = useQuery({
    queryKey: ['library-books', page, search],
    queryFn: () => libraryApi.searchBooks(search || undefined, { page, size: PAGE_SIZE, sort: 'title,asc' }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title={t('pages.library.title')}
        description={t('pages.library.description')}
        action={isAdmin ? <Button onClick={() => setAddOpen(true)}>+ Add book</Button> : undefined}
      />

      <div className="mb-4 w-64">
        <Input
          label="Search"
          placeholder="Title, author, or ISBN"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.content.length === 0 ? (
        <EmptyState
          title="No books found"
          message={isAdmin ? 'Add a book or adjust your search.' : 'No books match your search.'}
          action={isAdmin ? <Button onClick={() => setAddOpen(true)}>+ Add book</Button> : undefined}
        />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Author</TH>
                  <TH>ISBN</TH>
                  <TH>Available</TH>
                  {isAdmin && <TH className="text-right">Actions</TH>}
                </TR>
              </THead>
              <TBody>
                {query.data.content.map((book) => (
                  <TR key={book.id} className="hover:bg-slate-50">
                    <TD className="font-medium text-slate-900">{book.title}</TD>
                    <TD>{book.author}</TD>
                    <TD>{book.isbn || '—'}</TD>
                    <TD>
                      {book.availableCopies} / {book.totalCopies}
                    </TD>
                    {isAdmin && (
                      <TD className="text-right">
                        <button
                          className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={book.availableCopies <= 0}
                          onClick={() => setIssueBook(book)}
                        >
                          Issue
                        </button>
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

      {isAdmin && <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />}
      {isAdmin && issueBook && <IssueBookModal book={issueBook} onClose={() => setIssueBook(null)} />}
    </div>
  );
}

function AddBookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      libraryApi.createBook({ title, author, isbn: isbn || undefined, totalCopies: Number(totalCopies) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      setTitle('');
      setAuthor('');
      setIsbn('');
      setTotalCopies('1');
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add book"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="book-form" loading={mutation.isPending}>
            Add
          </Button>
        </>
      }
    >
      <form id="book-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Author" required value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Input label="ISBN (optional)" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        <Input
          label="Total copies"
          type="number"
          min={1}
          required
          value={totalCopies}
          onChange={(e) => setTotalCopies(e.target.value)}
        />
      </form>
    </Modal>
  );
}

function IssueBookModal({ book, onClose }: { book: BookDto; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [nameSearch, setNameSearch] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['library-issue-student-search', nameSearch],
    queryFn: () => studentsApi.list({ name: nameSearch || undefined, size: 8 }),
    enabled: nameSearch.length > 0,
  });

  const mutation = useMutation({
    mutationFn: () => libraryApi.issueBook({ bookId: book.id, studentId: studentId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-issues'] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Issue "${book.title}"`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!studentId} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Issue
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <Input
          label="Search student by name"
          value={nameSearch}
          onChange={(e) => {
            setNameSearch(e.target.value);
            setStudentId(null);
          }}
        />
        {studentsQuery.data && (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100">
            {studentsQuery.data.content.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No students found.</p>
            ) : (
              studentsQuery.data.content.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStudentId(s.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    studentId === s.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-slate-400">
                    {s.studentClass}-{s.section} · {s.rollNo}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
