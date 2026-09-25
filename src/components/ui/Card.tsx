import React from 'react';
import { cn } from './cn';

/* Cards are white on --paper with a 1px line and, at most, one soft shadow.
   No gradients, no coloured glows, no stacked rounded boxes. */

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'article' | 'section' | 'aside';
  /** `panel` is for page-level surfaces, `card` for list rows and tiles. */
  size?: 'card' | 'panel';
  interactive?: boolean;
  padded?: boolean;
};

export function Card({
  as: Tag = 'div',
  size = 'card',
  interactive = false,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-surface border border-line',
        size === 'panel' ? 'rounded-panel' : 'rounded-card',
        padded && (size === 'panel' ? 'p-4 sm:p-5' : 'p-4'),
        interactive &&
          'transition-shadow duration-150 hover:shadow-e3 focus-within:shadow-e3 cursor-pointer',
        !interactive && 'shadow-e1',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon ? (
          <span className="w-9 h-9 shrink-0 rounded-control bg-action-100 text-action flex items-center justify-center">
            <Icon className="w-4.5 h-4.5" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-navy truncate">{title}</h2>
          {description ? (
            <p className="text-xs text-ink-3 mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * KPI tile. The figure is the loudest thing in it — label above in muted
 * micro-type, delta below. Nothing else competes.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  onClick,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const toneRing: Record<string, string> = {
    default: 'text-action bg-action-100',
    success: 'text-success bg-success-bg',
    warning: 'text-warning bg-warning-bg',
    danger: 'text-danger bg-danger-bg',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'bg-surface border border-line rounded-card p-4 text-right w-full',
        onClick && 'hover:border-navy-300 hover:shadow-e2 transition-all cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-medium text-ink-3">{label}</span>
        {Icon ? (
          <span
            className={cn(
              'w-8 h-8 rounded-control flex items-center justify-center shrink-0',
              toneRing[tone],
            )}
          >
            <Icon className="w-4 h-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-bold text-navy tnum leading-none">{value}</div>
      {hint ? <div className="text-2xs text-ink-3 mt-1.5">{hint}</div> : null}
    </Tag>
  );
}
