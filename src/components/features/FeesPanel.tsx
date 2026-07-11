import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '@/api/fees';
import { paymentsApi } from '@/api/payments';
import { extractErrorMessage } from '@/api/client';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/context/AuthContext';
import { FEE_STATUSES, formatDate, formatMoney } from '@/lib/format';
import {
  Button,
  EmptyState,
  ErrorState,
  FeeBadge,
  Input,
  LoadingState,
  Modal,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import type { FeeDto, FeeStatus, FeeUpdateRequest } from '@/types';

export function FeesPanel({ studentId, canEdit }: { studentId: string; canEdit: boolean }) {
  const [editing, setEditing] = useState<FeeDto | null>(null);
  const { role, user } = useAuth();
  const canPay = role === 'PARENT';
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['fees', studentId],
    queryFn: () => feesApi.byStudent(studentId),
  });

  async function handlePay(fee: FeeDto) {
    setPayError(null);
    setPaySuccess(false);
    setPayingFeeId(fee.id);
    try {
      const order = await paymentsApi.initiate(fee.id);
      await openRazorpayCheckout({
        key: order.gatewayKeyId,
        amount: order.amountInSmallestUnit,
        currency: order.currency,
        order_id: order.gatewayOrderId,
        name: 'School Fee Payment',
        description: `${fee.term} fee`,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4f46e5' },
        handler: () => {
          setPaySuccess(true);
          queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
        },
        modal: { ondismiss: () => setPayingFeeId(null) },
      });
    } catch (err) {
      setPayError(extractErrorMessage(err, 'Online payments are not available right now. Please contact the school office.'));
    } finally {
      setPayingFeeId(null);
    }
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || query.data.length === 0)
    return <EmptyState title="No fee records" message="No fee records exist for this student yet." />;

  const totalDue = query.data.reduce((sum, f) => sum + f.amountDue, 0);
  const totalPaid = query.data.reduce((sum, f) => sum + f.amountPaid, 0);
  const showActions = canEdit || canPay;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-brand-50/60 px-5 py-4 ring-1 ring-inset ring-emerald-100">
        <div>
          <p className="text-2xl font-extrabold text-emerald-600">{formatMoney(totalPaid)}</p>
          <p className="text-xs font-medium text-slate-500">Total paid</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{formatMoney(totalDue - totalPaid)}</p>
          <p className="text-xs font-medium text-slate-500">Outstanding</p>
        </div>
      </div>

      {payError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {payError}
        </div>
      )}
      {paySuccess && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
          Payment submitted. It may take a few minutes to reflect here once confirmed.
        </div>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Term</TH>
            <TH>Due date</TH>
            <TH>Amount due</TH>
            <TH>Amount paid</TH>
            <TH>Status</TH>
            {showActions && <TH className="text-right">Actions</TH>}
          </TR>
        </THead>
        <TBody>
          {query.data.map((f) => {
            const outstanding = f.amountDue - f.amountPaid > 0 && f.status !== 'PAID';
            return (
              <TR key={f.id}>
                <TD>{f.term}</TD>
                <TD>{formatDate(f.dueDate)}</TD>
                <TD>{formatMoney(f.amountDue)}</TD>
                <TD>{formatMoney(f.amountPaid)}</TD>
                <TD>
                  <FeeBadge status={f.status} />
                </TD>
                {showActions && (
                  <TD className="text-right space-x-3">
                    {canEdit && (
                      <button
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        onClick={() => setEditing(f)}
                      >
                        Update
                      </button>
                    )}
                    {canPay && outstanding && (
                      <button
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                        disabled={payingFeeId === f.id}
                        onClick={() => handlePay(f)}
                      >
                        {payingFeeId === f.id ? 'Opening…' : 'Pay Now'}
                      </button>
                    )}
                  </TD>
                )}
              </TR>
            );
          })}
        </TBody>
      </Table>

      {canEdit && <EditFeeModal fee={editing} studentId={studentId} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditFeeModal({
  fee,
  studentId,
  onClose,
}: {
  fee: FeeDto | null;
  studentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amountPaid, setAmountPaid] = useState('');
  const [status, setStatus] = useState<FeeStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fee) {
      setAmountPaid(String(fee.amountPaid));
      setStatus(fee.status);
      setError(null);
    }
  }, [fee]);

  const mutation = useMutation({
    mutationFn: (payload: FeeUpdateRequest) => feesApi.update(fee!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ amountPaid: Number(amountPaid), status });
  }

  return (
    <Modal
      open={!!fee}
      onClose={onClose}
      title={fee ? `Update fee — ${fee.term}` : 'Update fee'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="fee-form" loading={mutation.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="fee-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input
          label="Amount paid"
          type="number"
          min={0}
          step="0.01"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as FeeStatus)}>
          {FEE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
