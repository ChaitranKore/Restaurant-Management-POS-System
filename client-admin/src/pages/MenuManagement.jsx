import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import Layout from '@/components/Layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatCurrency } from '@/lib/utils';

const EMPTY_ITEM = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  isVeg: 'true',
  prepTimeMinutes: '10',
};

/** Shared confirm-then-delete, so no destructive action is one stray tap away. */
function ConfirmDelete({ open, onOpenChange, title, description, onConfirm, busy }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button variant="destructive" loading={busy} onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemBusy, setItemBusy] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null); // { kind, id, label }
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    Promise.all([api.get('/categories?all=true'), api.get('/menu?all=true')])
      .then(([categoryRes, menuRes]) => {
        setCategories(categoryRes.data);
        setItems(menuRes.data);
      })
      .catch(() => setError('Could not load the menu.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (event) => {
    event.preventDefault();
    setCategoryBusy(true);
    try {
      await api.post('/categories', { name: newCategory });
      setNewCategory('');
      await load();
      toast.success('Category added');
    } catch (err) {
      toast.error('Could not add category', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setCategoryBusy(false);
    }
  };

  const addItem = async (event) => {
    event.preventDefault();
    setItemBusy(true);
    try {
      await api.post('/menu', {
        ...itemForm,
        price: Number(itemForm.price),
        prepTimeMinutes: Number(itemForm.prepTimeMinutes),
        isVeg: itemForm.isVeg === 'true',
      });
      setItemForm(EMPTY_ITEM);
      setItemDialogOpen(false);
      await load();
      toast.success('Menu item added');
    } catch (err) {
      toast.error('Could not add item', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setItemBusy(false);
    }
  };

  const toggleAvailable = async (item) => {
    // Reflect the toggle straight away; this gets used mid-service when
    // something runs out and the wait is annoying.
    setItems((previous) =>
      previous.map((entry) =>
        entry._id === item._id ? { ...entry, isAvailable: !entry.isAvailable } : entry
      )
    );
    try {
      await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
    } catch {
      setItems((previous) =>
        previous.map((entry) =>
          entry._id === item._id ? { ...entry, isAvailable: item.isAvailable } : entry
        )
      );
      toast.error('Could not update availability');
    }
  };

  const toggleCategoryActive = async (category) => {
    try {
      await api.put(`/categories/${category._id}`, { isActive: !category.isActive });
      await load();
    } catch {
      toast.error('Could not update category');
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      const path = pendingDelete.kind === 'item' ? '/menu' : '/categories';
      await api.delete(`${path}/${pendingDelete.id}`);
      setPendingDelete(null);
      await load();
      toast.success('Deleted');
    } catch (err) {
      toast.error('Could not delete', {
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Layout title="Menu" subtitle={`${items.length} items · ${categories.length} categories`}>
      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="mb-4 flex justify-end">
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus />
                  Add item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>New menu item</DialogTitle>
                  <DialogDescription>
                    It appears on the customer menu as soon as it's saved.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={addItem} className="space-y-4">
                  <Field label="Name" htmlFor="item-name">
                    <Input
                      id="item-name"
                      value={itemForm.name}
                      onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
                      required
                    />
                  </Field>

                  <Field label="Description" htmlFor="item-description">
                    <Textarea
                      id="item-description"
                      rows={2}
                      value={itemForm.description}
                      onChange={(event) =>
                        setItemForm({ ...itemForm, description: event.target.value })
                      }
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price" htmlFor="item-price">
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.price}
                        onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Prep time (min)" htmlFor="item-prep">
                      <Input
                        id="item-prep"
                        type="number"
                        min="0"
                        value={itemForm.prepTimeMinutes}
                        onChange={(event) =>
                          setItemForm({ ...itemForm, prepTimeMinutes: event.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="item-category">Category</Label>
                      <Select
                        value={itemForm.category}
                        onValueChange={(value) => setItemForm({ ...itemForm, category: value })}
                      >
                        <SelectTrigger id="item-category">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="item-veg">Dietary</Label>
                      <Select
                        value={itemForm.isVeg}
                        onValueChange={(value) => setItemForm({ ...itemForm, isVeg: value })}
                      >
                        <SelectTrigger id="item-veg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Vegetarian</SelectItem>
                          <SelectItem value="false">Non-vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Field
                    label="Image URL"
                    htmlFor="item-image"
                    hint="Optional. Without one the card shows a placeholder."
                  >
                    <Input
                      id="item-image"
                      type="url"
                      placeholder="https://…"
                      value={itemForm.imageUrl}
                      onChange={(event) =>
                        setItemForm({ ...itemForm, imageUrl: event.target.value })
                      }
                    />
                  </Field>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={itemBusy} disabled={!itemForm.category}>
                      Add item
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="No menu items"
                description="Add your first dish to get the menu live."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-9 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
                              <UtensilsCrossed
                                className="size-4 text-muted-foreground/50"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {item.category?.name ?? '—'}
                      </TableCell>
                      <TableCell className="nums font-semibold">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isAvailable ? 'success' : 'secondary'}>
                          {item.isAvailable ? 'Available' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleAvailable(item)}
                            aria-label={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                          >
                            {item.isAvailable ? <EyeOff /> : <Eye />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setPendingDelete({ kind: 'item', id: item._id, label: item.name })
                            }
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="mb-4 p-4">
            <form onSubmit={addCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="New category" htmlFor="category-name" className="flex-1">
                <Input
                  id="category-name"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Sides, Specials…"
                  required
                />
              </Field>
              <Button type="submit" loading={categoryBusy}>
                <Plus />
                Add
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {loading ? (
              <TableSkeleton rows={4} columns={3} />
            ) : categories.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="No categories"
                description="Categories group the menu for customers."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'success' : 'secondary'}>
                          {category.isActive ? 'Visible' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleCategoryActive(category)}
                            aria-label={category.isActive ? 'Hide category' : 'Show category'}
                          >
                            {category.isActive ? <EyeOff /> : <Eye />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setPendingDelete({
                                kind: 'category',
                                id: category._id,
                                label: category.name,
                              })
                            }
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDelete
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.label}"?`}
        description={
          pendingDelete?.kind === 'category'
            ? 'Categories that still have items on them cannot be deleted.'
            : 'This removes the item from the menu. Past orders keep their record of it.'
        }
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </Layout>
  );
}
