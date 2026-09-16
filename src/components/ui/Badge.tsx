import React from 'react';
import { cn } from './cn';

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'action'
  | 'navy'
  | 'sand';

/* Every status colour in the app resolves through this map, so "pending" looks
   the same in the admin table, the vendor calendar and the client tracker. */
const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-line-soft text-ink-2 border-line',
  info: 'bg-info-bg text-info border-info-border',
  success: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  danger: 'bg-danger-bg text-danger border-danger-border',
  action: 'bg-action-100 text-action border-action-200',
  navy: 'bg-navy text-white border-navy',
  sand: 'bg-sand-100 text-sand border-sand/30',
};

export function Badge({
  tone = 'neutral',
  icon: Icon,
  /** Small filled circle before the label — for live/among-many status lists. */
  dot = false,
  size = 'md',
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: React.ComponentType<{ className?: string }>;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        TONE[tone],
        className,
      )}
    >
      {dot ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

/**
 * Numeric counter for nav items and tabs. Always announces what it counts,
 * because a bare number next to an icon means nothing to a screen reader.
 */
export function CountBadge({
  count,
  tone = 'neutral',
  label,
  max = 99,
}: {
  count: number;
  tone?: BadgeTone;
  label: string;
  max?: number;
}) {
  if (!count) return null;
  return (
    <span
      className={cn(
        'min-w-5 h-5 px-1.5 rounded-full border text-2xs font-semibold tnum',
        'inline-flex items-center justify-center shrink-0',
        TONE[tone],
      )}
      aria-label={`${count} ${label}`}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
