import React, { useRef } from 'react';
import { cn } from './cn';
import { CountBadge } from './Badge';
import type { BadgeTone } from './Badge';

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  countTone?: BadgeTone;
};

/**
 * Horizontal tab strip with real roving-tabindex keyboard support (arrow keys,
 * Home/End) and proper `tablist`/`tab` semantics. Scrolls horizontally on
 * narrow screens instead of wrapping into a ragged block.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
  size = 'md',
  ariaLabel,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  ariaLabel: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    // RTL: ArrowLeft advances, ArrowRight goes back.
    const isRtl = document.documentElement.dir === 'rtl';
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
    let next = i;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else if (e.key === forward) next = (i + 1) % tabs.length;
    else next = (i - 1 + tabs.length) % tabs.length;

    onChange(tabs[next].id);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        'flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-line',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 whitespace-nowrap shrink-0',
              'font-medium transition-colors -mb-px border-b-2',
              size === 'sm' ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm',
              isActive
                ? 'border-action text-action'
                : 'border-transparent text-ink-3 hover:text-ink hover:border-line',
            )}
          >
            {Icon ? <Icon className="w-4 h-4 shrink-0" aria-hidden /> : null}
            {tab.label}
            {tab.count ? (
              <CountBadge
                count={tab.count}
                label={tab.label}
                tone={tab.countTone || (isActive ? 'action' : 'neutral')}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
