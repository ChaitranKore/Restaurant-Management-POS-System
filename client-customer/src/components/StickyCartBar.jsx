import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

/**
 * Mobile-only. Slides up as soon as the cart is non-empty so the running total
 * and the way forward are always one thumb-reach away, without stealing the
 * space a permanently-docked bar would.
 */
export default function StickyCartBar({ onOpen }) {
  const { itemCount, total } = useCart();

  return (
    <AnimatePresence>
      {itemCount > 0 ? (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden"
        >
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform active:scale-[0.99]"
          >
            <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-black/15">
              <ShoppingBag className="size-4.5" aria-hidden="true" />
              <span className="nums absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-card px-1 text-[11px] font-bold text-primary">
                {itemCount}
              </span>
            </span>
            <span className="flex-1 text-left text-sm font-semibold">
              {itemCount} item{itemCount === 1 ? '' : 's'} added
            </span>
            <span className="nums text-sm font-bold">{formatCurrency(total)}</span>
            <span className="text-sm font-semibold opacity-80">View →</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
