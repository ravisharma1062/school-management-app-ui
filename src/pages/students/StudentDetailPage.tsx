import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/api/students';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import {
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
import { StudentFormModal } from './StudentFormModal';
import type { Role } from '@/types';

type TabKey = 'profile' | 'attendance' | 'results' | 'fees';

const TAB_ROLES: Record<TabKey, Role[]> = {
  profile: ['ADMIN', 'TEACHER', 'PARENT'],
  attendance: ['TEACHER', 'PARENT'],
  results: ['TEACHER', 'PARENT'],
  fees: ['ADMIN', 'PARENT'],
};

const TAB_LABEL: Record<TabKey, string> = {
  profile: 'Profile',
  attendance: 'Attendance',
  results: 'Exam Results',
  fees: 'Fees',
};

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const { role } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const tabs = (Object.keys(TAB_ROLES) as TabKey[]).filter((t) => role && TAB_ROLES[t].includes(role));
  const [tab, setTab] = useState<TabKey>('profile');
  const activeTab = tabs.includes(tab) ? tab : 'profile';

  const query = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });

  const backLink = role === 'PARENT' ? '/children' : '/students';

  return (
    <div>
      <div className="mb-4">
        <Link to={backLink} className="text-sm text-brand-600 hover:text-brand-700">
          ← Back
        </Link>
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <div>
          <PageHeader
            title={query.data.name}
            description={`Class ${query.data.studentClass}-${query.data.section} · Roll ${query.data.rollNo}`}
            action={
              role === 'ADMIN' ? <Button onClick={() => setEditOpen(true)}>Edit</Button> : undefined
            }
          />

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
              <CardHeader title="Profile" />
              <CardBody>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={query.data.name} />
                  <Field label="Roll number" value={query.data.rollNo} />
                  <Field label="Class" value={query.data.studentClass} />
                  <Field label="Section" value={query.data.section} />
                  <Field label="Date of birth" value={formatDate(query.data.dob)} />
                  <Field label="Parent linked" value={query.data.parentId ? 'Yes' : 'No'} />
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
