import { useEffect, useRef, useState, type FormEvent } from 'react';
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
        action={isAdmin ? <Button onClick={() => setAddOpen(true)}>{t('library.addBook')}</Button> : undefined}
      />

      <div className="mb-4 w-64">
        <Input
          label={t('library.search')}
          placeholder={t('library.searchPlaceholder')}
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
          title={t('library.noBooksFound')}
          message={isAdmin ? t('library.addBookOrAdjust') : t('library.noBooksMatch')}
          action={isAdmin ? <Button onClick={() => setAddOpen(true)}>{t('library.addBook')}</Button> : undefined}
        />
      ) : (
        query.data && (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>{t('library.cover')}</TH>
                  <TH>{t('library.titleCol')}</TH>
                  <TH>{t('library.authorCol')}</TH>
                  <TH>{t('library.isbnCol')}</TH>
                  <TH>{t('library.availableCol')}</TH>
                  {isAdmin && <TH className="text-right">{t('common.actions')}</TH>}
                </TR>
              </THead>
              <TBody>
                {query.data.content.map((book) => (
                  <TR key={book.id} className="hover:bg-slate-50">
                    <TD>
                      <BookCoverCell book={book} canUpload={isAdmin} />
                    </TD>
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
                          {t('library.issue')}
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

function BookCoverCell({ book, canUpload }: { book: BookDto; canUpload: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!book.hasCoverImage) {
      setCoverUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    libraryApi.downloadCover(book.id).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setCoverUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [book.id, book.hasCoverImage]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => libraryApi.uploadCover(book.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library-books'] }),
  });

  return (
    <div className="flex items-center gap-2">
      {coverUrl ? (
        <img src={coverUrl} alt="" className="h-10 w-8 rounded object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-10 w-8 items-center justify-center rounded bg-slate-100 text-slate-300 ring-1 ring-slate-200">
          📖
        </div>
      )}
      {canUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
          />
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('library.uploadCover')}
          </button>
        </>
      )}
    </div>
  );
}

function AddBookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
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
      title={t('library.addBookModal')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="book-form" loading={mutation.isPending}>
            {t('common.add')}
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
        <Input label={t('library.title2')} required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label={t('library.author')} required value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Input label={t('library.isbnOptional')} value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        <Input
          label={t('library.totalCopies')}
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
  const { t } = useTranslation();
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
      title={t('library.issueBookModal', { title: book.title })}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!studentId} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {t('library.issue')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <Input
          label={t('library.searchStudentByName')}
          value={nameSearch}
          onChange={(e) => {
            setNameSearch(e.target.value);
            setStudentId(null);
          }}
        />
        {studentsQuery.data && (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100">
            {studentsQuery.data.content.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">{t('library.noStudentsFound')}</p>
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
