import { useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

const FILTERS = [
  { value: '', label: 'All methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

function SummaryTile({ label, value, icon: Icon, sub }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="nums mt-1 text-2xl font-bold">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/payments', { params: methodFilter ? { method: methodFilter } : {} })
      .then((res) => {
        if (!cancelled) setPayments(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load payments.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [methodFilter]);

  const totals = useMemo(() => {
    const completed = payments.filter((payment) => payment.status === 'completed');
    const sum = (list) => list.reduce((total, payment) => total + payment.amount, 0);
    return {
      all: sum(completed),
      cash: sum(completed.filter((payment) => payment.method === 'cash')),
      card: sum(completed.filter((payment) => payment.method === 'card')),
      count: completed.length,
    };
  }, [payments]);

  return (
    <Layout title="Payments" subtitle="Transaction history and reconciliation">
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <SummaryTile
          label="Total taken"
          value={formatCurrency(totals.all)}
          icon={Wallet}
          sub={`${totals.count} completed transaction${totals.count === 1 ? '' : 's'}`}
        />
        <SummaryTile label="Cash" value={formatCurrency(totals.cash)} icon={Banknote} />
        <SummaryTile label="Card" value={formatCurrency(totals.card)} icon={CreditCard} />
      </div>

      <div className="mb-4 flex gap-1.5">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setMethodFilter(filter.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              methodFilter === filter.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No payments recorded"
            description="Payments taken through the POS or the customer app will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Taken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    {payment.order?.orderNumber ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 capitalize">
                      {payment.method === 'cash' ? (
                        <Banknote className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <CreditCard className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      )}
                      {payment.method}
                      {payment.method === 'card' && payment.cardLast4 ? (
                        <span className="nums text-muted-foreground">····{payment.cardLast4}</span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="nums font-semibold">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={payment.status === 'completed' ? 'success' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDateTime(payment.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  );
}
