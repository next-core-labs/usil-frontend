import React from 'react';
import { Scale, X } from 'lucide-react';
import { cn } from '../components/ui/cn';
import { useLang } from './lang';
import { useStorefront } from './context';
import { useIsMobile } from './primitives';

/** Navy sticky bar that appears once a product is picked for comparison. */
export function CompareBar() {
  const { t } = useLang();
  const sf = useStorefront();
  const mobile = useIsMobile();
  if (!sf.compared.length || sf.sitePage === 'compare') return null;
  const ready = sf.compared.length >= 2;

  return (
    <div
      className="sticky z-[65] mx-auto max-w-[720px] px-4 pb-4"
      style={{ bottom: mobile ? '78px' : 0 }}
    >
      <div className="flex items-center gap-3 ps-4 pe-2.5 py-2.5 rounded-card bg-navy text-white shadow-[0_24px_50px_-20px_rgba(10,26,51,.6)]">
        <Scale className="w-[18px] h-[18px] text-sky shrink-0" aria-hidden />
        <div className="flex gap-1.5 flex-1 min-w-0 overflow-hidden">
          {sf.compared.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 ps-2.5 pe-1 py-1 rounded-lg bg-white/10 text-[13px] font-semibold whitespace-nowrap min-w-0"
            >
              <span className="truncate max-w-[150px]">{p.title}</span>
              <button
                type="button"
                onClick={() => sf.removeFromCompare(p.id)}
                className="w-[22px] h-[22px] rounded-md bg-white/15 text-white grid place-items-center min-h-0"
                aria-label={`${t.cmpRemove}: ${p.title}`}
              >
                <X className="w-3 h-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <span className="text-[13px] text-on-navy-muted whitespace-nowrap tnum">{sf.compared.length}/2</span>
        <button
          type="button"
          disabled={!ready}
          onClick={() => sf.navigate('/compare')}
          className={cn(
            'h-10 px-4 rounded-control text-sm font-bold text-white whitespace-nowrap min-h-0',
            ready ? 'bg-action hover:bg-action-hover' : 'bg-ink-1 cursor-not-allowed',
          )}
        >
          {t.compare}
        </button>
      </div>
    </div>
  );
}
