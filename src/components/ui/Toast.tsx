import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from './cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  /** Optional single undo/retry affordance. */
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone, action?: Toast['action']) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, { cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { cls: 'bg-success-bg border-success-border text-success', Icon: CheckCircle2 },
  error: { cls: 'bg-danger-bg border-danger-border text-danger', Icon: AlertCircle },
  warning: { cls: 'bg-warning-bg border-warning-border text-warning', Icon: AlertTriangle },
  info: { cls: 'bg-info-bg border-info-border text-info', Icon: Info },
};

const DURATION = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info', action?: Toast['action']) => {
      const id = nextId.current++;
      // Cap the stack so a loop of failures cannot bury the screen.
      setToasts((list) => [...list.slice(-2), { id, message, tone, action }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Anchored below the app bar, above the bottom nav, never over either. */}
      <div
        className="fixed top-3 inset-x-0 z-[100] flex flex-col items-center gap-2 px-3 pointer-events-none usil-safe-top"
        role="region"
        aria-label="التنبيهات"
      >
        {toasts.map((t) => {
          const { cls, Icon } = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto w-full max-w-sm flex items-start gap-2.5',
                'px-3.5 py-3 rounded-card border shadow-e3 usil-pop-in bg-surface',
                cls,
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0 mt-px" aria-hidden />
              <p className="flex-1 text-sm font-medium text-ink leading-relaxed">
                {t.message}
              </p>
              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {t.action.label}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="إغلاق التنبيه"
                className="shrink-0 text-ink-3 hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Returns a no-op outside a provider rather than throwing, so a component that
 * happens to render in an isolated tree (or a test) never crashes the app over
 * a notification.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? { toast: () => {}, dismiss: () => {} };
}
