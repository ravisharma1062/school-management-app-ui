import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface PaginationProps {
  page: number; // 0-based
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) {
    return (
      <p className="px-1 py-2 text-xs text-slate-500">
        {totalElements} {totalElements === 1 ? t('common.result') : t('common.results')}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-xs text-slate-500">
        {t('common.pageOf', { page: page + 1, totalPages, count: totalElements })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.previous')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
