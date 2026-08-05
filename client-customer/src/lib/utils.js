import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** `12.5` → `$12.50`. Guards against the undefined prices an in-flight fetch yields. */
export function formatCurrency(value) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

const time = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

export function formatTime(date) {
  return time.format(new Date(date));
}

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDateTime(date) {
  return dateTime.format(new Date(date));
}

/** Whole minutes since `date`. Drives the kitchen ticket age timers. */
export function minutesSince(date) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
}

/** `mm:ss` since `date`, for tickets where the exact age matters. */
export function elapsedSince(date) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "8 minutes ago" — for order history and activity feeds. */
export function relativeTime(date) {
  const minutes = minutesSince(date);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** The order lifecycle, in the order the kitchen advances through it. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'completed',
];

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Initials for avatar fallbacks: "Priya Nair" → "PN". */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}
