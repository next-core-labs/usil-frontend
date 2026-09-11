import React from 'react';
import { Layers } from 'lucide-react';
import { OCCASION_PACKAGES, AudienceFilter } from '../../data/saudiMarket';

interface OccasionPackagesProps {
  onPick: (category: string, audience: AudienceFilter) => void;
  compact?: boolean;
}

export const OccasionPackages: React.FC<OccasionPackagesProps> = ({ onPick, compact = false }) => {
  return (
    <section id="occasion-packages" className="text-right space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-[#155EEF]" />
        <h2 className="text-sm font-extrabold text-[#0A1A33]">باقات حسب نوع المناسبة</h2>
      </div>
      {compact ? null : (
        <p className="text-xs text-[#475467] max-w-2xl">
          اختر نوع الحفل لنصفّي المورّدين المناسبين بنفس التاريخ والمدينة.
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {OCCASION_PACKAGES.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => {
              onPick(pack.category, pack.audience);
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-right rounded-2xl border border-[#E4E7EC] bg-white p-3.5 hover:border-[#155EEF] card-shadow hover:card-shadow-hover transition-all"
          >
            <p className="text-sm font-extrabold text-[#0A1A33]">{pack.title}</p>
            <p className="text-[11px] text-[#475467] mt-1 leading-snug line-clamp-1">{pack.blurb}</p>
            <span className="inline-block mt-2 text-[11px] font-bold text-[#155EEF]">عرض المورّدين ←</span>
          </button>
        ))}
      </div>
    </section>
  );
};
