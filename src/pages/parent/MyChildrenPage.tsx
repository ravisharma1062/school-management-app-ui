import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { studentsApi } from '@/api/students';
import { formatDate } from '@/lib/format';
import { Card, CardBody, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui';

export function MyChildrenPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['my-children'],
    queryFn: () => studentsApi.myChildren(),
  });

  return (
    <div>
      <PageHeader title={t('pages.children.title')} description={t('pages.children.description')} />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title={t('myChildren.noChildrenLinked')}
          message={t('myChildren.contactAdmin')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((child) => (
            <Link key={child.id} to={`/students/${child.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardBody>
                  <p className="text-base font-semibold text-slate-900">{child.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('myChildren.classPrefix')} {child.studentClass}-{child.section} · {t('myChildren.roll')} {child.rollNo}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{t('myChildren.born')} {formatDate(child.dob)}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
