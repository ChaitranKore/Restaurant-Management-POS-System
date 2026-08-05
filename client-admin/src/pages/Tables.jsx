import { useEffect, useState } from 'react';
import { Plus, Table2, Trash2, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
];

/* Status as colour, so the floor reads at a glance rather than cell by cell. */
const STATUS_STYLES = {
  available: 'border-success/35 bg-success/10',
  occupied: 'border-warning/45 bg-warning/12',
  reserved: 'border-chart-3/40 bg-chart-3/10',
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ number: '', capacity: '4' });
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    api
      .get('/tables')
      .then((res) => setTables(res.data))
      .catch(() => toast.error('Could not load tables'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const addTable = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/tables', {
        number: Number(form.number),
        capacity: Number(form.capacity),
      });
      setForm({ number: '', capacity: '4' });
      await load();
      toast.success('Table added');
    } catch (err) {
      toast.error('Could not add table', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (table, status) => {
    const previousStatus = table.status;
    setTables((previous) =>
      previous.map((entry) => (entry._id === table._id ? { ...entry, status } : entry))
    );
    try {
      await api.put(`/tables/${table._id}`, { status });
    } catch {
      setTables((previous) =>
        previous.map((entry) =>
          entry._id === table._id ? { ...entry, status: previousStatus } : entry
        )
      );
      toast.error('Could not update the table');
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/tables/${pendingDelete._id}`);
      setPendingDelete(null);
      await load();
      toast.success('Table removed');
    } catch (err) {
      toast.error('Could not delete', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const counts = STATUSES.map((status) => ({
    ...status,
    count: tables.filter((table) => table.status === status.value).length,
  }));

  return (
    <Layout
      title="Tables"
      subtitle={counts.map((status) => `${status.count} ${status.label.toLowerCase()}`).join(' · ')}
    >
      <Card className="mb-5 p-4">
        <form onSubmit={addTable} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Table number" htmlFor="table-number" className="sm:w-40">
            <Input
              id="table-number"
              type="number"
              min="1"
              value={form.number}
              onChange={(event) => setForm({ ...form, number: event.target.value })}
              required
            />
          </Field>
          <Field label="Seats" htmlFor="table-capacity" className="sm:w-32">
            <Input
              id="table-capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              required
            />
          </Field>
          <Button type="submit" loading={busy}>
            <Plus />
            Add table
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <EmptyState
            icon={Table2}
            title="No tables yet"
            description="Add tables so dine-in orders can be assigned to a seat."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((table) => (
            <Card
              key={table._id}
              className={cn('flex flex-col gap-2 border p-3', STATUS_STYLES[table.status])}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="nums text-2xl font-bold leading-none">{table.number}</p>
                  <p className="nums mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" aria-hidden="true" />
                    {table.capacity} seats
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="-mr-1 -mt-1 text-muted-foreground hover:text-destructive"
                  onClick={() => setPendingDelete(table)}
                  aria-label={`Delete table ${table.number}`}
                >
                  <Trash2 />
                </Button>
              </div>

              <Select value={table.status} onValueChange={(value) => setStatus(table, value)}>
                <SelectTrigger className="mt-auto h-9 text-xs" aria-label={`Status of table ${table.number}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete table {pendingDelete?.number}?</DialogTitle>
            <DialogDescription>
              Orders already assigned to it keep their record. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="destructive" loading={deleteBusy} onClick={confirmDelete}>
              Delete table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
