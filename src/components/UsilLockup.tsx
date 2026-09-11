import React from 'react';
import { UsilMark } from './UsilMark';

type UsilLockupProps = {
  variant?: 'color' | 'inverse';
  subtitle?: string;
  compact?: boolean;
};

/** Primary horizontal lockup: Arabic name + Latin, separator, mark on the right (RTL). */
export function UsilLockup({ variant = 'color', subtitle, compact = false }: UsilLockupProps) {
  const inverse = variant === 'inverse';
  const name = inverse ? 'text-white' : 'text-[#0A1A33]';
  const latin = inverse ? 'text-white/70' : 'text-[#667085]';
  const rule = inverse ? 'bg-white/25' : 'bg-[#E4E7EC]';

  return (
    <div className="flex items-center gap-2.5 sm:gap-3" dir="rtl">
      <UsilMark
        variant={inverse ? 'inverse' : 'color'}
        className={compact ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'}
      />
      <span className={`w-px self-stretch ${rule}`} aria-hidden="true" />
      <div className="text-right leading-none">
        <div className={`font-display font-extrabold tracking-tight ${name} ${compact ? 'text-lg' : 'text-xl sm:text-[1.35rem]'}`}>
          يوصل
        </div>
        <div className={`font-latin font-medium ${latin} ${compact ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1'}`}>
          Usil
        </div>
        {subtitle ? (
          <div className={`mt-1 font-normal ${compact ? 'text-[9px]' : 'text-[10px]'} ${inverse ? 'text-white/55' : 'text-[#667085]'}`}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
