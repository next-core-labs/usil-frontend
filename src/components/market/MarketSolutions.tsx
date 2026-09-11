import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { MARKET_SOLUTIONS } from '../../data/saudiMarket';

interface MarketSolutionsProps {
  compact?: boolean;
}

export const MarketSolutions: React.FC<MarketSolutionsProps> = ({ compact = false }) => {
  return (
    <section id="market-solutions" className="text-right space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#155EEF]" />
        <h2 className="text-sm font-extrabold text-[#0A1A33]">وش نحل في حفلتك</h2>
      </div>
      {compact ? null : (
        <p className="text-xs text-[#475467] max-w-2xl">
          سعر نهائي، مورد معتمد، ووصول مضمون.
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {MARKET_SOLUTIONS.map((row) => (
          <div key={row.pain} className="rounded-2xl border border-[#E4E7EC] bg-white p-3.5 card-shadow">
            <p className="text-[11px] font-bold text-[#D92D20] line-clamp-1">المشكلة: {row.pain}</p>
            <p className="text-xs text-[#101828] mt-1.5 leading-snug font-medium line-clamp-2">{row.fix}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
