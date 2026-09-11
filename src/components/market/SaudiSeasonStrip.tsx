import React from 'react';
import { CalendarRange } from 'lucide-react';
import { SAUDI_SEASON } from '../../data/saudiMarket';

interface SaudiSeasonStripProps {
  compact?: boolean;
}

export const SaudiSeasonStrip: React.FC<SaudiSeasonStripProps> = ({ compact = false }) => {
  return (
    <section className="text-right" aria-label="رزنامة مواسم السعودية">
      {compact ? null : (
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="w-4 h-4 text-[#155EEF]" />
          <h2 className="text-sm font-bold text-[#0A1A33]">رزنامة المواسم — احجز قبل الزحمة</h2>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SAUDI_SEASON.map((row) => (
          <div
            key={row.month}
            className="min-w-[168px] shrink-0 rounded-xl border border-[#E4E7EC] bg-white p-3 card-shadow"
          >
            <p className="text-xs font-extrabold text-[#0A1A33]">{row.month}</p>
            <p className="text-[11px] text-[#475467] mt-1 leading-snug line-clamp-1">{row.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
