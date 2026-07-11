import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '@/api/analytics';
import { formatDate, formatMoney } from '@/lib/format';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { AttendanceTrendPointDto } from '@/types';

const RANGE_OPTIONS = [7, 30, 90];

export function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const [studentClass, setStudentClass] = useState('');
  const [range, setRange] = useState(30);

  const attendanceQuery = useQuery({
    queryKey: ['analytics-attendance', studentClass, range],
    queryFn: () => analyticsApi.attendanceTrend(studentClass, range),
  });
  const feeSummaryQuery = useQuery({
    queryKey: ['analytics-fee-summary', studentClass],
    queryFn: () => analyticsApi.feeSummary(studentClass),
  });
  const atRiskQuery = useQuery({
    queryKey: ['analytics-at-risk'],
    queryFn: () => analyticsApi.atRiskStudents(),
  });

  return (
    <div>
      <PageHeader title={t('pages.analytics.title')} description={t('pages.analytics.description')} />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-48">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Class (optional)</label>
          <input
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            placeholder="e.g. 5"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="w-40">
          <Select label="Range" value={String(range)} onChange={(e) => setRange(Number(e.target.value))}>
            {RANGE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Last {r} days
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance trend" subtitle="Share of marked days present or late, per day" />
          <CardBody>
            {attendanceQuery.isLoading ? (
              <LoadingState />
            ) : attendanceQuery.isError ? (
              <ErrorState error={attendanceQuery.error} onRetry={() => attendanceQuery.refetch()} />
            ) : attendanceQuery.data ? (
              <AttendanceTrendChart points={attendanceQuery.data} />
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fee collection" />
          <CardBody>
            {feeSummaryQuery.isLoading ? (
              <LoadingState />
            ) : feeSummaryQuery.isError ? (
              <ErrorState error={feeSummaryQuery.error} onRetry={() => feeSummaryQuery.refetch()} />
            ) : feeSummaryQuery.data ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {feeSummaryQuery.data.collectionPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs font-medium text-slate-500">collected</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, feeSummaryQuery.data.collectionPercentage)}%` }}
                    />
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Total due</dt>
                    <dd className="font-semibold text-slate-800">{formatMoney(feeSummaryQuery.data.totalDue)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Total paid</dt>
                    <dd className="font-semibold text-emerald-600">{formatMoney(feeSummaryQuery.data.totalPaid)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Outstanding</dt>
                    <dd className="font-semibold text-slate-800">{formatMoney(feeSummaryQuery.data.totalOutstanding)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Overdue records</dt>
                    <dd className="font-semibold text-red-600">{feeSummaryQuery.data.overdueCount}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="At-risk students" subtitle="Low attendance (below 75% over 30 days) or fees overdue 7+ days" />
        {atRiskQuery.isLoading ? (
          <CardBody>
            <LoadingState />
          </CardBody>
        ) : atRiskQuery.isError ? (
          <CardBody>
            <ErrorState error={atRiskQuery.error} onRetry={() => atRiskQuery.refetch()} />
          </CardBody>
        ) : atRiskQuery.data && atRiskQuery.data.length === 0 ? (
          <CardBody>
            <EmptyState title="No at-risk students" message="Nobody currently meets the attendance or fee risk criteria." />
          </CardBody>
        ) : (
          atRiskQuery.data && (
            <Table>
              <THead>
                <TR>
                  <TH>Student</TH>
                  <TH>Class</TH>
                  <TH>Attendance</TH>
                  <TH>Fees</TH>
                </TR>
              </THead>
              <TBody>
                {atRiskQuery.data.map((s) => (
                  <TR key={s.studentId}>
                    <TD className="font-medium text-slate-900">{s.studentName}</TD>
                    <TD>
                      {s.studentClass}-{s.section}
                    </TD>
                    <TD>
                      {s.attendanceAtRisk ? (
                        <Badge tone="red">{s.attendancePercentage?.toFixed(0)}% present</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TD>
                    <TD>
                      {s.feeAtRisk ? (
                        <Badge tone="red">{s.maxDaysOverdue} days overdue</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )
        )}
      </Card>
    </div>
  );
}

function AttendanceTrendChart({ points }: { points: AttendanceTrendPointDto[] }) {
  if (points.length === 0) return <EmptyState title="No data" message="No attendance records in this range." />;

  const width = 700;
  const height = 220;
  const padding = 32;
  const barGap = 2;
  const barWidth = Math.max(2, (width - padding * 2) / points.length - barGap);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Attendance trend chart">
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = height - padding - (pct / 100) * (height - padding * 2);
        return (
          <g key={pct}>
            <line x1={padding} y1={y} x2={width - 4} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={0} y={y + 4} fontSize={10} fill="#94a3b8">
              {pct}%
            </text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const barHeight = (p.attendancePercentage / 100) * (height - padding * 2);
        const x = padding + i * (barWidth + barGap);
        const y = height - padding - barHeight;
        return (
          <rect key={p.date} x={x} y={y} width={barWidth} height={barHeight} fill="#4f46e5" rx={1}>
            <title>
              {formatDate(p.date)}: {p.attendancePercentage.toFixed(0)}% ({p.presentCount} present, {p.lateCount} late,{' '}
              {p.absentCount} absent, {p.excusedCount} excused)
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
