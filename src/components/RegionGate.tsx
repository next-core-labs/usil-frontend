import React, { useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import {
  ALL_CITIES_LABEL,
  FEATURED_MARKET_PLACES,
  SAUDI_REGIONS,
} from '../data/saudiPlaces';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { UsilLockup } from './UsilLockup';

type RegionGateProps = {
  open: boolean;
  required?: boolean;
  selected?: string;
  onSelect: (place: string) => void;
  onClose?: () => void;
};

export function RegionGate({ open, required = false, selected, onSelect, onClose }: RegionGateProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0A1A33]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usil-region-gate-title"
      dir="rtl"
    >
      {!required ? (
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="إغلاق اختيار المنطقة"
          onClick={onClose}
        />
      ) : null}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl p-5 sm:p-6 text-right">
        {!required && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 start-4 w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="flex justify-center mb-4">
          <UsilLockup compact />
        </div>

        <h2 id="usil-region-gate-title" className="text-xl sm:text-2xl font-extrabold text-[#0A1A33] text-center">
          وين المناسبة؟
        </h2>
        <p className="mt-2 text-sm text-[#475467] text-center leading-relaxed">
          اختر المنطقة أول، وبعدين تظهر لك أزرار الأقسام والمورّدين المتاحين عندك.
        </p>

        <div className="mt-4">
          <PlaceSearchSelect
            value={selected && selected !== ALL_CITIES_LABEL ? selected : ''}
            onChange={onSelect}
            includeAll={false}
            boxed
            className="w-full"
            placeholder="ابحث مدينة أو محافظة أو قرية"
            aria-label="ابحث عن منطقتك"
          />
        </div>

        <p className="mt-5 mb-2 text-[11px] font-bold text-[#667085]">أشهر المدن</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 justify-start">
          {FEATURED_MARKET_PLACES.map((place) => {
            const active = selected === place.name;
            return (
              <button
                key={place.name}
                type="button"
                onClick={() => onSelect(place.name)}
                className="shrink-0 w-[4.75rem] flex flex-col items-center gap-1.5 min-h-[44px]"
              >
                <span
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    active ? 'bg-[#0A1A33] text-white ring-2 ring-[#155EEF] ring-offset-2' : 'bg-[#EAF0FE] text-[#155EEF]'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </span>
                <span className={`text-[11px] font-extrabold leading-tight text-center ${active ? 'text-[#0A1A33]' : 'text-[#475467]'}`}>
                  {place.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2 text-[11px] font-bold text-[#667085]">كل المناطق</p>
        <div className="flex flex-wrap gap-1.5">
          {SAUDI_REGIONS.map((region) => {
            const active = selected === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => onSelect(region)}
                className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-bold border ${
                  active
                    ? 'bg-[#155EEF] border-[#155EEF] text-white'
                    : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-[#155EEF] hover:text-[#155EEF]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelect(ALL_CITIES_LABEL)}
          className="mt-4 w-full min-h-[44px] rounded-xl border border-[#E4E7EC] text-sm font-bold text-[#475467] hover:border-[#155EEF] hover:text-[#155EEF]"
        >
          كل مناطق المملكة
        </button>
      </div>
    </div>
  );
}
