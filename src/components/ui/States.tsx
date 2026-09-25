import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

/**
 * Empty state. Every one of these should say what is missing, why, and give
 * the one action that fixes it — never just "لا توجد نتائج".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-5 rounded-panel bg-surface border border-line',
        className,
      )}
    >
      {Icon ? (
        <span className="w-12 h-12 rounded-full bg-action-100 text-action flex items-center justify-center mb-4">
          <Icon className="w-6 h-6" aria-hidden />
        </span>
      ) : null}
      <h3 className="text-base font-bold text-navy">{title}</h3>
      {description ? (
        <p className="text-sm text-ink-3 mt-2 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {children ? <div className="mt-5 w-full">{children}</div> : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Error state. Distinct from empty on purpose: an empty list is normal, a
 * failed fetch is not, and the user's next action differs (retry vs. change
 * the filters).
 */
export function ErrorState({
  title = 'تعذر تحميل البيانات',
  description,
  onRetry,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-5 rounded-panel bg-surface border border-danger-border',
        className,
      )}
      role="alert"
    >
      <span className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      {description ? (
        <p className="text-sm text-ink-3 mt-2 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="primary" icon={RotateCcw} onClick={onRetry} className="mt-6">
          إعادة المحاولة
        </Button>
      ) : null}
    </div>
  );
}

/** Single shimmer block. Compose these into layout-shaped skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('usil-skeleton rounded-control', className)}
      aria-hidden
    />
  );
}

/**
 * Skeleton shaped like the product grid. Matching the real layout is the whole
 * point — a generic spinner tells the user nothing about what is arriving.
 */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="جارٍ تحميل المنتجات"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-line bg-surface overflow-hidden"
        >
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-11 w-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton shaped like a table. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="جارٍ التحميل">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-1/3' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Centred inline spinner for in-panel waits. */
export function LoadingState({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-3"
      role="status"
      aria-live="polite"
    >
      <span className="w-8 h-8 rounded-full border-2 border-line border-t-action animate-spin" aria-hidden />
      <p className="text-sm text-ink-3">{label}</p>
    </div>
  );
}
