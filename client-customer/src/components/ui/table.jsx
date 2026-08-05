import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** Wrapped in its own scroll container so a wide table never scrolls the page. */
const Table = forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        data-slot="table"
        className={cn('w-full caption-bottom text-sm border-collapse', className)}
        {...props}
      />
    </div>
  );
});

const TableHeader = forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />;
});

const TableBody = forwardRef(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
});

const TableFooter = forwardRef(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      data-slot="table-footer"
      className={cn('border-t bg-muted/50 font-medium', className)}
      {...props}
    />
  );
});

const TableRow = forwardRef(function TableRow({ className, interactive = false, ...props }, ref) {
  return (
    <tr
      ref={ref}
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors data-[state=selected]:bg-accent',
        interactive && 'cursor-pointer hover:bg-accent/55',
        className
      )}
      {...props}
    />
  );
});

const TableHead = forwardRef(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap',
        className
      )}
      {...props}
    />
  );
});

const TableCell = forwardRef(function TableCell({ className, ...props }, ref) {
  return (
    <td
      ref={ref}
      data-slot="table-cell"
      className={cn('px-4 py-3 align-middle whitespace-nowrap', className)}
      {...props}
    />
  );
});

const TableCaption = forwardRef(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
