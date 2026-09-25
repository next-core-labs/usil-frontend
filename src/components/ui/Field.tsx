import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

/* The single input treatment for the whole app. Nine copies of this string had
   already drifted into three incompatible variants (px-4 py-3 vs px-3 py-2.5
   vs p-2.5, ring-focus vs background-focus, slate-200 vs #E4E7EC borders).
   Everything imports this now. */
export const controlClass =
  'w-full min-h-11 bg-paper border border-line rounded-control px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-muted transition-colors ' +
  'focus:outline-none focus:border-action focus:bg-surface focus:ring-4 focus:ring-action/10 ' +
  'disabled:bg-line-soft disabled:text-muted disabled:cursor-not-allowed';

const invalidClass =
  'border-danger-border bg-danger-bg focus:border-danger focus:ring-danger/10';

type FieldProps = {
  label: React.ReactNode;
  /** Renders the `*` and sets `required` on the control. */
  required?: boolean;
  /** Persistent guidance. Shown even when valid — unlike `error`. */
  hint?: React.ReactNode;
  /** Validation message. Replaces the hint and flips the control to danger. */
  error?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    required: boolean;
    className: string;
  }) => React.ReactNode;
  className?: string;
};

/**
 * Wraps any control with a real `<label for>`, a required marker, and a
 * hint/error region that is wired up via `aria-describedby`, so screen readers
 * announce the validation message with the field instead of stranding it.
 */
export function Field({
  label,
  required = false,
  hint,
  error,
  icon: Icon,
  children,
  className,
}: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('block', className)}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-2"
      >
        {Icon ? <Icon className="w-4 h-4 text-action shrink-0" aria-hidden /> : null}
        <span>{label}</span>
        {required ? (
          <span className="text-danger" aria-hidden>
            *
          </span>
        ) : null}
        {!required ? (
          <span className="text-2xs font-normal text-muted">(اختياري)</span>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
        className: cn(controlClass, error && invalidClass),
      })}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Plain input already wired to the shared treatment. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(controlClass, className)} {...rest} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlClass, 'min-h-24 py-2.5 leading-relaxed', className)}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select ref={ref} className={cn(controlClass, 'cursor-pointer', className)} {...rest}>
    {children}
  </select>
));
Select.displayName = 'Select';
