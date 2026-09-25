import React from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';

export type ActiveFilter = {
  /** Stable key so React and the clear handler agree on identity. */
  key: string;
  /** What kind of filter this is, e.g. "المدينة". */
  label: string;
  /** The chosen value, e.g. "الرياض". */
  value: string;
  onClear: () => void;
};

/**
 * Shows every filter currently narrowing a result set, each individually
 * removable, plus a clear-all.
 *
 * Before this, the marketplace applied category, city, audience, price and
 * fulfillment filters with no combined indication of what was active — the
 * only "clear filters" button in the app lived inside the empty state, so a
 * user who filtered themselves down to two results could not see why.
 */
export function FilterChips({
  filters,
  onClearAll,
  resultCount,
  className,
}: {
  filters: ActiveFilter[];
  onClearAll: () => void;
  resultCount?: number;
  className?: string;
}) {
  if (!filters.length) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="region"
      aria-label="الفلاتر المطبّقة"
    >
      {typeof resultCount === 'number' ? (
        <span className="text-xs text-ink-3 me-1">
          <span className="font-semibold text-ink tnum">{resultCount}</span> نتيجة بعد التصفية
        </span>
      ) : null}

      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 ps-2.5 pe-1 py-1 rounded-full bg-action-100 border border-action-200 text-action text-xs font-medium"
        >
          <span className="text-action/70">{f.label}:</span>
          <span className="max-w-[9rem] truncate">{f.value}</span>
          <button
            type="button"
            onClick={f.onClear}
            aria-label={`إزالة فلتر ${f.label}: ${f.value}`}
            /* 28px: above WCAG 2.2 AA's 24px minimum target size. A full 44px
               would force the chip taller than the text it labels; the chip
               itself stays tappable for the common case of removing it. */
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-action/15 transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="min-h-11 px-2 -mx-2 text-xs font-semibold text-ink-3 hover:text-action underline underline-offset-2 transition-colors"
      >
        مسح الكل
      </button>
    </div>
  );
}
