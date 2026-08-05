import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, Trash2, UserRoundX, UsersRound } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/utils';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff', phone: '' };

const ROLE_VARIANT = { admin: 'default', staff: 'secondary', customer: 'outline' };

export default function Staff() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Could not load accounts'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/users', form);
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      await load();
      toast.success('Account created');
    } catch (err) {
      toast.error('Could not create account', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (user, role) => {
    const previousRole = user.role;
    setUsers((previous) =>
      previous.map((entry) => (entry.id === user.id ? { ...entry, role } : entry))
    );
    try {
      await api.put(`/users/${user.id}`, { role });
      toast.success(`${user.name} is now ${role}`);
    } catch (err) {
      setUsers((previous) =>
        previous.map((entry) => (entry.id === user.id ? { ...entry, role: previousRole } : entry))
      );
      toast.error('Could not change role', {
        description: err.response?.data?.message || 'Please try again.',
      });
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      await load();
    } catch {
      toast.error('Could not update the account');
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/users/${pendingDelete.id}`);
      setPendingDelete(null);
      await load();
      toast.success('Account deleted');
    } catch (err) {
      toast.error('Could not delete', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Layout
      title="Staff & Roles"
      subtitle={`${users.length} account${users.length === 1 ? '' : 's'}`}
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus />
              <span className="hidden sm:inline">New account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create an account</DialogTitle>
              <DialogDescription>
                Staff can run the POS and the kitchen board. Admins can also manage the menu,
                tables, accounts and payments.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createUser} className="space-y-4">
              <Field label="Full name" htmlFor="staff-name">
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </Field>
              <Field label="Email" htmlFor="staff-email">
                <Input
                  id="staff-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </Field>
              <Field label="Password" htmlFor="staff-password" hint="At least 6 characters.">
                <Input
                  id="staff-password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger id="staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={busy}>
                  Create account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersRound} title="No accounts" description="Create the first one." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                // You can't demote, disable or delete yourself — that's the
                // fastest way to lock the last admin out of the console.
                const isSelf = user.id === me?.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback>{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            {user.name}
                            {isSelf ? (
                              <Badge variant="outline" className="text-[10px]">
                                you
                              </Badge>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      {isSelf ? (
                        <Badge variant={ROLE_VARIANT[user.role]} className="capitalize">
                          <ShieldCheck />
                          {user.role}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) => changeRole(user, value)}
                        >
                          <SelectTrigger
                            className="h-8 w-32 text-xs"
                            aria-label={`Role for ${user.name}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSelf}
                          onClick={() => toggleActive(user)}
                          aria-label={user.isActive ? `Disable ${user.name}` : `Enable ${user.name}`}
                        >
                          <UserRoundX />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSelf}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingDelete(user)}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}'s account?</DialogTitle>
            <DialogDescription>
              They lose access immediately. Orders they took keep their record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="destructive" loading={deleteBusy} onClick={confirmDelete}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
