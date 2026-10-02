import React, { useEffect } from 'react';
import { MapPin, X, Check, Globe, ShieldCheck, Search } from 'lucide-react';
import {
  ALL_CITIES_LABEL,
  FEATURED_MARKET_PLACES,
  SAUDI_REGIONS,
  regionCoverageStats,
} from '../data/saudiPlaces';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { UsilMark } from './UsilMark';
import { cn } from './ui/cn';
import { useLang } from '../storefront/lang';

type RegionGateProps = {
  open: boolean;
  /** First visit: the gate cannot be dismissed until a region is picked. */
  required?: boolean;
  selected?: string;
  onSelect: (place: string) => void;
  onClose?: () => void;
};

/**
 * «وين المناسبة؟» — the first-visit region picker, in the storefront's visual
 * language: a navy brand panel beside the picker on wide screens, a bottom
 * sheet on phones. Picking a region (or all of Saudi Arabia) is the only exit
 * when `required`.
 */
export function RegionGate({ open, required = false, selected, onSelect, onClose }: RegionGateProps) {
  const { L } = useLang();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !required) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, required, onClose]);

  if (!open) return null;

  const current = selected && selected !== ALL_CITIES_LABEL ? selected : '';
  // On a first visit the app defaults to «all regions» before anyone picked it; don't present that as a choice.
  const allSelected = !required && selected === ALL_CITIES_LABEL;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-navy/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usil-region-gate-title"
      dir="rtl"
    >
      {!required ? (
        <button type="button" className="absolute inset-0 cursor-default min-h-0" aria-label={L('إغلاق اختيار المنطقة', 'Close region picker')} onClick={onClose} />
      ) : null}

      <div className="relative w-full md:max-w-[960px] max-h-[94dvh] md:max-h-[88vh] grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] bg-surface rounded-t-[28px] md:rounded-[24px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(10,26,51,.6)] usil-pop-in">
        {/* Brand panel (desktop) */}
        <aside className="hidden md:flex relative flex-col justify-between bg-navy text-white p-8 overflow-hidden">
          <div aria-hidden className="absolute -start-24 -bottom-24 w-72 h-72 rounded-full border-[56px] border-action/25" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <UsilMark variant="inverse" className="w-9 h-9" />
              <span className="font-bold text-[22px] tracking-[-0.02em]">{L('يوصل', 'Usil')}</span>
            </div>
            <div className="mt-8 flex items-center gap-2.5 text-[13px] font-semibold text-sky-200 tracking-[.04em]">
              <span className="tnum">01</span>
              <span className="w-6 h-0.5 bg-sky" aria-hidden />
              {L('المنطقة', 'Region')}
            </div>
            <h2 className="mt-2 text-[clamp(26px,2.6vw,34px)] font-bold tracking-[-0.03em] leading-[1.15]">
              {L('كل مورّد قريب منك', 'Every provider near you')}
            </h2>
            <p className="mt-3 text-sm leading-[1.7] text-on-navy-soft">
              {L('السوق يعرض فقط المورّدين اللي يغطون منطقتك، بأسعار نهائية شاملة الضريبة.', 'The market shows only providers covering your region, at final VAT-inclusive prices.')}
            </p>
          </div>
          <ul className="relative mt-8 flex flex-col gap-3 text-[13px] text-on-navy-soft">
            <li className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-white/10 text-sky grid place-items-center shrink-0"><MapPin className="w-4 h-4" aria-hidden /></span>
              {L('13 منطقة · 292 مدينة ومحافظة وقرية', '13 regions · 292 places')}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-white/10 text-sky grid place-items-center shrink-0"><ShieldCheck className="w-4 h-4" aria-hidden /></span>
              {L('تقدر تغيّر المنطقة في أي وقت من الشريط العلوي', 'Change the region any time from the top bar')}
            </li>
          </ul>
        </aside>

        {/* Picker */}
        <div className="relative overflow-y-auto overscroll-contain p-5 md:p-7 usil-safe-bottom">
          <div className="md:hidden pt-1 pb-3 flex justify-center" aria-hidden>
            <span className="w-12 h-1.5 rounded-full bg-navy-300" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 md:hidden">
              <UsilMark className="w-9 h-9" />
            </div>
            <div className="flex-1 min-w-0 text-start">
              <h2 id="usil-region-gate-title" className="text-[clamp(24px,2.6vw,32px)] font-bold tracking-[-0.03em] text-navy">
                وين المناسبة؟
              </h2>
              <p className="mt-1.5 text-sm leading-[1.7] text-ink-1">
                اختر المنطقة أول، وبعدين تظهر لك أزرار الأقسام والمورّدين المتاحين عندك.
              </p>
            </div>
            {!required && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-control border border-line bg-surface text-navy grid place-items-center shrink-0 hover:border-action"
                aria-label={L('إغلاق', 'Close')}
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            ) : null}
          </div>

          {current || allSelected ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-control bg-action-100 text-action text-[13px] font-semibold">
              <Check className="w-3.5 h-3.5" aria-hidden />
              {L('المنطقة الحالية', 'Current region')}: {allSelected ? L('كل مناطق المملكة', 'All of Saudi Arabia') : current}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-2 p-1.5 rounded-[14px] bg-paper border border-line focus-within:border-action focus-within:ring-4 focus-within:ring-action/10">
            <span className="w-10 h-10 rounded-control bg-action text-white grid place-items-center shrink-0">
              <Search className="w-4 h-4" aria-hidden />
            </span>
            <PlaceSearchSelect
              value={current}
              onChange={onSelect}
              includeAll={false}
              hideIcon
              className="flex-1 min-w-0 [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-[15px]"
              placeholder={L('ابحث مدينة أو محافظة أو قرية', 'Search a city, governorate or village')}
              aria-label={L('ابحث عن منطقتك', 'Search your region')}
            />
          </div>

          <div className="mt-6 flex items-center gap-2.5 text-[13px] font-semibold text-action tracking-[.04em]">
            <span className="w-6 h-0.5 bg-action" aria-hidden />
            أشهر المدن
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {FEATURED_MARKET_PLACES.map((place, i) => {
              const active = selected === place.name;
              const tints = ['#DBE7FF', '#FFE8D6', '#D6F5E3', '#FFF3C4', '#D9F0FF'];
              return (
                <button
                  key={place.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(place.name)}
                  className={cn(
                    'relative text-start p-3.5 rounded-card border transition-all min-h-[104px] flex flex-col justify-between gap-4',
                    active ? 'bg-navy border-navy text-white' : 'bg-surface border-line text-navy hover:border-action hover:-translate-y-0.5',
                  )}
                >
                  <span
                    className={cn('w-10 h-10 rounded-xl grid place-items-center', active ? 'bg-action text-white' : 'text-navy')}
                    style={active ? undefined : { background: tints[i % tints.length] }}
                  >
                    <MapPin className="w-[18px] h-[18px]" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold leading-tight">{place.name}</span>
                    <span className={cn('block text-xs mt-0.5', active ? 'text-on-navy-soft' : 'text-ink-3')}>{place.blurb}</span>
                  </span>
                  {active ? (
                    <span className="absolute top-3 end-3 w-5 h-5 rounded-full bg-white text-navy grid place-items-center">
                      <Check className="w-3 h-3" aria-hidden />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2.5 text-[13px] font-semibold text-action tracking-[.04em]">
            <span className="w-6 h-0.5 bg-action" aria-hidden />
            كل المناطق
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SAUDI_REGIONS.map((region) => {
              const active = selected === region;
              const stats = regionCoverageStats(region);
              return (
                <button
                  key={region}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(region)}
                  title={`${stats.governorates} محافظة · ${stats.villages} قرية ومركز`}
                  className={cn(
                    'h-11 ps-3.5 pe-2.5 rounded-control border text-sm font-semibold inline-flex items-center gap-2 transition-colors',
                    active ? 'bg-action border-action text-white' : 'bg-surface border-line text-navy hover:border-action hover:text-action',
                  )}
                >
                  {region}
                  <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-md tnum', active ? 'bg-white/15 text-white' : 'bg-paper text-ink-3')}>
                    {stats.governorates + stats.villages}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelect(ALL_CITIES_LABEL)}
            aria-pressed={allSelected}
            className={cn(
              'mt-6 w-full h-12 rounded-xl border text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-colors',
              allSelected ? 'bg-navy border-navy text-white' : 'bg-surface border-navy-300 text-navy hover:bg-navy hover:text-white hover:border-navy',
            )}
          >
            <Globe className="w-[18px] h-[18px]" aria-hidden />
            كل مناطق المملكة
          </button>
          <p className="mt-3 text-xs text-ink-3 text-center leading-relaxed">
            {L('البحث يشمل كل المحافظات والقرى والمراكز داخل المناطق الثلاث عشرة.', 'Search covers every governorate, village and centre inside the 13 regions.')}
          </p>
        </div>
      </div>
    </div>
  );
}
