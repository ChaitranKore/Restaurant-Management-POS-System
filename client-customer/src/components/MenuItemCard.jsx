import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Minus, Plus, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn, formatCurrency } from '@/lib/utils';

/** Small green/red square, the convention on Indian menus for veg vs non-veg. */
function VegMark({ isVeg }) {
  const label = isVeg ? 'Vegetarian' : 'Non-vegetarian';
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-card/90',
        isVeg ? 'border-success' : 'border-destructive'
      )}
    >
      <span className={cn('size-1.5 rounded-full', isVeg ? 'bg-success' : 'bg-destructive')} />
    </span>
  );
}

function ImageFallback({ name }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent to-secondary">
      <UtensilsCrossed className="size-8 text-muted-foreground/45" aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </div>
  );
}

export default function MenuItemCard({ item }) {
  const { addItem, updateQuantity, getQuantity } = useCart();
  const quantity = getQuantity(item._id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const unavailable = item.isAvailable === false;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition-shadow duration-300 hover:shadow-lg',
        unavailable && 'opacity-60'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.imageUrl && !imageFailed ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={cn(
              'size-full object-cover transition-all duration-500 group-hover:scale-[1.04]',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        ) : (
          <ImageFallback name={item.name} />
        )}

        {/* Keeps the overlaid chips legible whatever the photo is doing. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <VegMark isVeg={item.isVeg !== false} />
        </div>

        {item.prepTimeMinutes ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Clock className="size-3" aria-hidden="true" />
            {item.prepTimeMinutes} min
          </span>
        ) : null}

        {unavailable ? (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-sm">
              Unavailable today
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-snug">{item.name}</h3>
        {item.description ? (
          <p className="line-clamp-2 flex-1 text-sm text-muted-foreground text-pretty">
            {item.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="nums font-semibold text-[0.95rem]">{formatCurrency(item.price)}</span>

          {/* "Add" becomes the stepper in place, so the control never moves and
              the tap target stays where the thumb already is. `wait` matters:
              with the two controls swapping in the same slot, letting the old
              one linger renders the label straight through the new stepper. */}
          <AnimatePresence mode="wait" initial={false}>
            {quantity === 0 ? (
              <motion.div
                key="add"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14 }}
              >
                <Button size="sm" disabled={unavailable} onClick={() => addItem(item)} className="px-4">
                  Add
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14 }}
                className="flex items-center gap-1 rounded-lg bg-primary p-0.5 text-primary-foreground"
              >
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  onClick={() => updateQuantity(item._id, quantity - 1)}
                  className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/15"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="nums min-w-5 text-center text-sm font-bold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Add another ${item.name}`}
                  onClick={() => updateQuantity(item._id, quantity + 1)}
                  className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/15"
                >
                  <Plus className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
