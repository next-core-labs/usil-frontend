import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../components/ui/cn';

/**
 * Scroll reveal from the design: elements start 24px low and transparent and
 * ease in when they enter the viewport. Uses one shared observer.
 */
let observer: IntersectionObserver | null = null;
function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.seen = '1';
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );
  return observer;
}

export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'article' | 'li';
  delay?: number;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'children'>) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    if (!io) {
      el.dataset.seen = '1';
      return;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      data-reveal=""
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Narrow (<820px in the design → `md`) vs desktop. */
export function useIsMobile(query = '(max-width: 819px)') {
  const [mobile, setMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return mobile;
}

/** Numbered section kicker: `01 —— الأقسام` then the heading. */
export function SectionHead({
  n,
  kicker,
  title,
  sub,
  action,
  tone = 'light',
  className,
}: {
  n?: string;
  kicker: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const kickerColor = tone === 'dark' ? 'text-sky-200' : 'text-action';
  const lineColor = tone === 'dark' ? 'bg-sky' : 'bg-action';
  return (
    <div className={cn('flex items-end justify-between gap-4 flex-wrap', className)}>
      <div className="min-w-0">
        <div className={cn('flex items-center gap-2.5 text-[13px] font-semibold tracking-[.04em]', kickerColor)}>
          {n ? <span className="tnum">{n}</span> : null}
          <span className={cn('w-6 h-0.5', lineColor)} aria-hidden />
          <span>{kicker}</span>
        </div>
        <h2 className="mt-2 font-bold tracking-[-0.03em] text-[clamp(26px,3.4vw,40px)] leading-[1.15] sf-balance">
          {title}
        </h2>
        {sub ? <p className="mt-3 text-[15px] leading-[1.7] text-ink-1 max-w-[420px]">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Underlined "view all" link with an arrow that points the reading direction. */
export function ArrowLink({
  children,
  onClick,
  href = '#',
  tone = 'light',
}: {
  children: React.ReactNode;
  onClick: () => void;
  href?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold no-underline border-b-2 border-action pb-0.5 transition-colors',
        tone === 'dark' ? 'text-white hover:text-white' : 'text-navy hover:text-navy',
      )}
    >
      {children}
      <ArrowIcon className="w-4 h-4" />
    </a>
  );
}

/** Arrow that follows the text direction (left in RTL, right in LTR). */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('shrink-0 rtl:-scale-x-100', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/** Chevron pointing "forward" in the reading direction. */
export function ChevronForward({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('shrink-0 rtl:-scale-x-100', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** Infinite horizontal marquee; content is duplicated so the loop is seamless. */
export function Marquee({
  children,
  duration = 26,
  gap = 28,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  duration?: number;
  gap?: number;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      dir="ltr"
      className={cn('overflow-hidden', className)}
      style={{ maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)' }}
    >
      <div
        className={cn('flex w-max items-center', innerClassName)}
        style={{ gap, animation: `lm-marquee ${duration}s linear infinite` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/** Soft blurred colour blobs behind navy sections. */
export function Blobs({
  blobs,
}: {
  blobs: Array<{ color: string; left: string; top: string; size: number; delay: number }>;
}) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: 0.45,
            filter: 'blur(70px)',
            animation: 'lm-blob 18s ease-in-out infinite',
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Breadcrumb row: `الرئيسية › القسم › المنتج`. */
export function Crumbs({
  items,
  tone = 'light',
}: {
  items: Array<{ label: string; onClick?: () => void }>;
  tone?: 'light' | 'dark';
}) {
  const muted = tone === 'dark' ? 'text-on-navy-muted' : 'text-ink-3';
  const current = tone === 'dark' ? 'text-white' : 'text-navy';
  return (
    <nav className={cn('flex items-center gap-1.5 text-[13px] flex-wrap', muted)} aria-label="breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {item.onClick && !last ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  item.onClick?.();
                }}
                className={cn('no-underline hover:underline', muted)}
              >
                {item.label}
              </a>
            ) : (
              <span className={cn(last && 'font-medium', last && current, 'truncate max-w-[60vw]')}>{item.label}</span>
            )}
            {!last ? <ChevronForward className="w-3 h-3" /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** Rounded pill chip with selected state, as used in filters and option groups. */
export function Pill({
  active,
  onClick,
  children,
  className,
  size = 'md',
  variant = 'navy',
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'navy' | 'action';
}) {
  const on = variant === 'navy' ? 'bg-navy border-navy text-white' : 'bg-action border-action text-white';
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-control border font-medium transition-all whitespace-nowrap',
        size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-[38px] px-3.5 text-sm',
        active ? on : 'bg-surface border-line text-navy hover:border-action',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Initial-letter avatar square. */
export function InitialAvatar({
  name,
  className,
  bg = 'bg-navy',
}: {
  name: string;
  className?: string;
  bg?: string;
}) {
  const initial = String(name || '').trim()[0] || 'ي';
  return (
    <span
      aria-hidden
      className={cn('grid place-items-center rounded-xl text-white font-bold shrink-0', bg, className)}
    >
      {initial}
    </span>
  );
}

/** Thin 4-segment progress rail. */
export function StepRail({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn('flex-1 h-1 rounded-sm', i <= step ? 'bg-action' : 'bg-line')} />
      ))}
    </div>
  );
}
