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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/75 backdrop-blur-sm"
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
      <div className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl p-5 sm:p-6 text-right usil-safe-bottom">
        {!required && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 start-4 w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="flex justify-center mb-4">
          <UsilLockup compact />
        </div>

        <h2 id="usil-region-gate-title" className="text-xl sm:text-2xl font-bold text-navy text-center">
          وين المناسبة؟
        </h2>
        <p className="mt-2 text-sm text-ink-2 text-center leading-relaxed">
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

        <p className="mt-5 mb-2 text-2xs font-medium text-ink-3">أشهر المدن</p>
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
                    active ? 'bg-navy text-white ring-2 ring-action ring-offset-2' : 'bg-action-100 text-action'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </span>
                <span className={`text-2xs font-bold leading-tight text-center ${active ? 'text-navy' : 'text-ink-2'}`}>
                  {place.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2 text-2xs font-medium text-ink-3">كل المناطق</p>
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
                    ? 'bg-action border-action text-white'
                    : 'bg-white border-line text-ink-1 hover:border-action hover:text-action'
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
          className="mt-4 w-full min-h-[44px] rounded-xl border border-line text-sm font-bold text-ink-2 hover:border-action hover:text-action"
        >
          كل مناطق المملكة
        </button>
      </div>
    </div>
  );
}
