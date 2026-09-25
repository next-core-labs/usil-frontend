import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'navy'
  | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/* One primary action per view. `secondary` is the default for everything that
   is not THE action — that is what stops screens turning into a wall of blue. */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-action text-white hover:bg-action-hover active:bg-action-pressed shadow-e1 disabled:bg-navy-300',
  secondary:
    'bg-surface text-ink border border-line hover:border-navy-300 hover:bg-paper active:bg-line-soft disabled:text-muted',
  ghost:
    'bg-transparent text-ink-2 hover:bg-line-soft active:bg-line disabled:text-muted',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 shadow-e1 disabled:bg-navy-300',
  navy:
    'bg-navy text-white hover:bg-navy-700 active:bg-navy-800 shadow-e1 disabled:bg-navy-300',
  link:
    'bg-transparent text-action hover:text-action-hover underline-offset-4 hover:underline p-0 h-auto min-h-0',
};

/* min-h-11 (44px) everywhere it can be tapped — the iOS/Android touch-target
   floor. `icon` is square so icon-only buttons stay tappable too. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 h-9 px-3 text-xs gap-1.5',
  md: 'min-h-11 h-11 px-4 text-sm gap-2',
  lg: 'min-h-12 h-12 px-5 text-base gap-2',
  icon: 'min-h-11 w-11 h-11 p-0 justify-center',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconEnd?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon: Icon,
      iconEnd: IconEnd,
      fullWidth = false,
      className,
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        /* aria-busy tells a screen reader the control is working; the spinner
           alone is invisible to one. */
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-control font-semibold',
          'transition-colors duration-150 select-none touch-manipulation',
          'active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100',
          VARIANT[variant],
          SIZE[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
        ) : Icon ? (
          <Icon className="w-4 h-4 shrink-0" aria-hidden />
        ) : null}
        {children}
        {IconEnd && !loading ? (
          <IconEnd className="w-4 h-4 shrink-0" aria-hidden />
        ) : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
