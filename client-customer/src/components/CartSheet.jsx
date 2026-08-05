import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { useCart } from '@/context/CartContext';
import { useMediaQuery } from '@/lib/use-media-query';
import { formatCurrency } from '@/lib/utils';

function CartLine({ item, onQuantityChange, onRemove }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex gap-3 py-3">
        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center">
              <UtensilsCrossed className="size-4 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="nums text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border">
              <button
                type="button"
                aria-label={`Remove one ${item.name}`}
                onClick={() => onQuantityChange(item.quantity - 1)}
                className="grid size-7 place-items-center rounded-l-lg transition-colors hover:bg-accent"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="nums min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                type="button"
                aria-label={`Add another ${item.name}`}
                onClick={() => onQuantityChange(item.quantity + 1)}
                className="grid size-7 place-items-center rounded-r-lg transition-colors hover:bg-accent"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from cart`}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        <span className="nums shrink-0 text-sm font-semibold">
          {formatCurrency(item.price * item.quantity)}
        </span>
      </div>
      <Separator />
    </motion.li>
  );
}

export default function CartSheet({ open, onOpenChange }) {
  const { items, updateQuantity, removeItem, subtotal, tax, total, itemCount } = useCart();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 640px)');

  const goToCheckout = () => {
    onOpenChange(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className="gap-0">
        <SheetHeader>
          <SheetTitle>Your order</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? 'Nothing here yet.'
              : `${itemCount} item${itemCount === 1 ? '' : 's'} ready to go.`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add something from the menu and it'll show up here."
            action={<Button onClick={() => onOpenChange(false)}>Browse the menu</Button>}
          />
        ) : (
          <>
            <ul className="min-h-0 flex-1 overflow-y-auto px-5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartLine
                    key={item.menuItem}
                    item={item}
                    onQuantityChange={(quantity) => updateQuantity(item.menuItem, quantity)}
                    onRemove={() => removeItem(item.menuItem)}
                  />
                ))}
              </AnimatePresence>
            </ul>

            <SheetFooter className="border-t border-border bg-card pt-4">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="nums font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax (5%)</dt>
                  <dd className="nums font-medium">{formatCurrency(tax)}</dd>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="nums">{formatCurrency(total)}</dd>
                </div>
              </dl>
              <Button size="lg" block onClick={goToCheckout}>
                Go to checkout
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
