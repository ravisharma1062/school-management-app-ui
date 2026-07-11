import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentsApi } from '@/api/students';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { AttendancePanel } from '@/components/features/AttendancePanel';
import { ExamResultsPanel } from '@/components/features/ExamResultsPanel';
import { FeesPanel } from '@/components/features/FeesPanel';
import { TransportPanel } from '@/components/features/TransportPanel';
import { LibraryPanel } from '@/components/features/LibraryPanel';
import { StudentFormModal } from './StudentFormModal';
import type { Role } from '@/types';

type TabKey = 'profile' | 'attendance' | 'results' | 'fees' | 'transport' | 'library';

const TAB_ROLES: Record<TabKey, Role[]> = {
  profile: ['ADMIN', 'TEACHER', 'PARENT'],
  attendance: ['TEACHER', 'PARENT'],
  results: ['TEACHER', 'PARENT'],
  fees: ['ADMIN', 'PARENT'],
  transport: ['ADMIN', 'PARENT'],
  library: ['ADMIN', 'PARENT'],
};

export function StudentDetailPage() {
  const { t } = useTranslation();
  const TAB_LABEL: Record<TabKey, string> = {
    profile: t('studentDetail.profile'),
    attendance: t('studentDetail.attendance'),
    results: t('studentDetail.results'),
    fees: t('studentDetail.fees'),
    transport: t('studentDetail.transport'),
    library: t('studentDetail.library'),
  };
  const { id = '' } = useParams();
  const { role } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const tabs = (Object.keys(TAB_ROLES) as TabKey[]).filter((t) => role && TAB_ROLES[t].includes(role));
  const [tab, setTab] = useState<TabKey>('profile');
  const activeTab = tabs.includes(tab) ? tab : 'profile';

  const query = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });

  const archiveMutation = useMutation({
    mutationFn: () => (query.data?.active ? studentsApi.archive(id) : studentsApi.restore(id)),
    onSuccess: () => {
      setArchiveError(null);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => setArchiveError(extractErrorMessage(err)),
  });

  const backLink = role === 'PARENT' ? '/children' : '/students';

  return (
    <div>
      <div className="mb-4">
        <Link to={backLink} className="text-sm text-brand-600 hover:text-brand-700">
          {t('studentDetail.back')}
        </Link>
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <div>
          <PageHeader
            title={
              <span className="inline-flex items-center gap-2">
                {query.data.name}
                {!query.data.active && <Badge tone="gray">{t('common.archived')}</Badge>}
              </span>
            }
            description={`${t('studentDetail.class')} ${query.data.studentClass}-${query.data.section} · ${t('common.rollNo')} ${query.data.rollNo}`}
            action={
              role === 'ADMIN' ? (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setEditOpen(true)}>{t('common.edit')}</Button>
                  <Button
                    variant="danger"
                    loading={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate()}
                  >
                    {query.data.active ? t('common.archive') : t('common.restore')}
                  </Button>
                </div>
              ) : undefined
            }
          />

          {archiveError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {archiveError}
            </div>
          )}

          {/* Tabs */}
          <div
            className="glass mb-4 inline-flex flex-wrap gap-1 rounded-2xl p-1.5 shadow-card"
            role="tablist"
          >
            {tabs.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTab === t}
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeTab === t
                    ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-glow'
                    : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <Card>
              <CardHeader title={t('studentDetail.profile')} />
              <CardBody>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('studentDetail.fullName')} value={query.data.name} />
                  <Field label={t('studentDetail.rollNumber')} value={query.data.rollNo} />
                  <Field label={t('studentDetail.class')} value={query.data.studentClass} />
                  <Field label={t('studentDetail.section')} value={query.data.section} />
                  <Field label={t('studentDetail.dateOfBirth')} value={formatDate(query.data.dob)} />
                  <Field label={t('studentDetail.parentLinked')} value={query.data.parentId ? t('common.yes') : t('common.no')} />
                </dl>
              </CardBody>
            </Card>
          )}

          {activeTab === 'attendance' && (
            <Card>
              <CardBody>
                <AttendancePanel studentId={id} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'results' && (
            <Card>
              <CardBody>
                <ExamResultsPanel studentId={id} canRecord={role === 'TEACHER'} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'fees' && (
            <Card>
              <CardBody>
                <FeesPanel studentId={id} canEdit={role === 'ADMIN'} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'transport' && (
            <Card>
              <CardBody>
                <TransportPanel studentId={id} canAssign={role === 'ADMIN'} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'library' && (
            <Card>
              <CardBody>
                <LibraryPanel studentId={id} canManage={role === 'ADMIN'} />
              </CardBody>
            </Card>
          )}

          {role === 'ADMIN' && (
            <StudentFormModal open={editOpen} onClose={() => setEditOpen(false)} student={query.data} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
