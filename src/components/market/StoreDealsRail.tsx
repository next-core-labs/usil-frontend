import React from 'react';
import { OCCASION_PACKAGES, AudienceFilter } from '../../data/saudiMarket';

interface StoreDealsRailProps {
  onSelectCategory?: (categoryId: string) => void;
  onPickPackage: (category: string, audience: AudienceFilter, query: string) => void;
}

export const StoreDealsRail: React.FC<StoreDealsRailProps> = ({ onPickPackage }) => {
  return (
    <section className="space-y-4 text-right" aria-label="باقات حسب المناسبة">
      <div>
        <h2 className="text-sm font-bold text-navy mb-2">باقات حسب المناسبة</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {OCCASION_PACKAGES.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => {
                onPickPackage(pack.category, pack.audience, pack.title);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 w-[11.5rem] rounded-xl border border-line bg-white p-3 text-right hover:border-action card-shadow"
            >
              <p className="text-xs font-medium text-navy">{pack.title}</p>
              <p className="text-2xs text-ink-2 mt-1 leading-snug line-clamp-2">{pack.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
