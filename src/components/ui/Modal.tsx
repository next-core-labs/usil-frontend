import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

const WIDTH = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: keyof typeof WIDTH;
  /** Sticky action row pinned to the bottom of the panel. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Set false for destructive flows that must be dismissed deliberately. */
  dismissOnBackdrop?: boolean;
};

/**
 * The one dialog shell. Handles Escape, backdrop dismissal, body scroll lock,
 * focus capture on open and focus restoration on close, plus the safe-area
 * padding the native shells need. Screens used to hand-roll all of this, which
 * is why some trapped scroll and some did not.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  dismissOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Lock the page behind the dialog so the backdrop does not scroll away.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the panel so keyboard and screen-reader users land here.
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      (first ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  const onBackdrop = useCallback(() => {
    if (dismissOnBackdrop) onClose();
  }, [dismissOnBackdrop, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 usil-modal-scroll"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-navy/50 backdrop-blur-[2px] usil-fade-in"
        onClick={onBackdrop}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full bg-surface rounded-panel shadow-e4 my-auto',
          'flex flex-col max-h-[calc(100dvh-2rem)] outline-none usil-pop-in',
          WIDTH[size],
        )}
      >
        <header className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy">{title}</h2>
            {description ? (
              <p className="text-sm text-ink-3 mt-1 leading-relaxed">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="إغلاق"
            className="shrink-0 -m-1"
          >
            <X className="w-5 h-5" aria-hidden />
          </Button>
        </header>

        <div className="p-4 sm:p-5 overflow-y-auto grow">{children}</div>

        {footer ? (
          <footer className="p-4 sm:p-5 border-t border-line bg-paper rounded-b-panel shrink-0 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Destructive confirmation. Replaces `window.confirm`, which is unstyled,
 * unbranded, blocks the JS thread and renders as a jarring system sheet inside
 * the Capacitor shells.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'danger',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2 leading-relaxed">{message}</p>
    </Modal>
  );
}
