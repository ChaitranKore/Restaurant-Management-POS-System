import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef(function Card({ className, interactive = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground border border-border rounded-xl shadow-xs',
        interactive &&
          'transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    />
  );
});

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn('flex flex-col gap-1 px-5 pt-5 pb-3', className)}
      {...props}
    />
  );
});

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
});

const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
});

const CardAction = forwardRef(function CardAction({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn('absolute top-5 right-5', className)}
      {...props}
    />
  );
});

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} data-slot="card-content" className={cn('px-5 pb-5', className)} {...props} />;
});

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn('flex items-center gap-2 px-5 pb-5 pt-0', className)}
      {...props}
    />
  );
});

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
