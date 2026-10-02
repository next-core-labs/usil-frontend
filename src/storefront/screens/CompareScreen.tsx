import React from 'react';
import { Wallet, Star, Clock, LayoutGrid, MapPin, Truck, Zap, ShieldCheck, Check, Scale } from 'lucide-react';
import type { ServiceItem } from '../../types';
import { FULFILLMENT_LANE_BY_ID } from '../../data/saudiMarket';
import { BOOKING_MODE_AR_LABEL } from '../../contracts/vendors/vendor-listings';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money } from '../money';
import { Crumbs, useIsMobile } from '../primitives';
import { productPhoto } from '../ProductCard';

type Cell = { v: string; win: boolean };

/** Two-column comparison table from the design, driven by real listing fields. */
export function CompareScreen() {
  const { t, ar, L } = useLang();
  const sf = useStorefront();
  const mobile = useIsMobile();
  const items = sf.compared.slice(0, 2);
  const cols = mobile ? '90px 1fr 1fr' : '200px 1fr 1fr';

  if (items.length < 2) {
    return (
      <main className="max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        <Crumbs items={[{ label: t.navCatalog, onClick: () => sf.goCatalog() }, { label: t.compare }]} />
        <h1 className="mt-3.5 mb-1.5 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.compareTitle}</h1>
        <p className="mb-6 text-sm text-ink-3">{t.compareSub}</p>
        <div className="py-16 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <Scale className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{t.compareEmpty}</div>
          <div className="text-sm text-ink-3 mt-1.5">{t.compareEmptySub}</div>
          {items.length === 1 ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-control bg-paper text-sm font-semibold text-navy">
              {items[0].title}
            </div>
          ) : null}
          <div>
            <button type="button" onClick={() => sf.goCatalog()} className="mt-[22px] h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold">
              {t.browse}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const [a, b] = items;
  const cheaper = a.price <= b.price ? 0 : 1;
  const ratingOf = (s: ServiceItem) => (s.reviewsCount ? s.rating : -1);
  const higher = ratingOf(a) >= ratingOf(b) ? 0 : 1;
  const bothUnrated = !a.reviewsCount && !b.reviewsCount;

  const cell = (v: string, win: boolean): Cell => ({ v, win });
  const lanes = (s: ServiceItem) => (s.fulfillment || []).map((l) => FULFILLMENT_LANE_BY_ID[l]?.chip || l).join(' · ') || '—';
  const mode = (s: ServiceItem) => (ar ? BOOKING_MODE_AR_LABEL[s.bookingMode || 'approval'] : s.bookingMode === 'instant' ? 'Instant booking' : 'Vendor approval');
  const cancel = (s: ServiceItem) => L(`إلغاء مجاني قبل 7 أيام · 50٪ قبل 3 أيام`, `Free up to 7 days · 50% up to 3 days`);
  const ratingText = (s: ServiceItem) => (s.reviewsCount ? `${s.rating.toFixed(1)} (${s.reviewsCount})` : t.noRatingYet);

  const rows: Array<{ label: string; Icon: React.ComponentType<{ className?: string }>; cells: Cell[] }> = [
    { label: t.cmpPrice, Icon: Wallet, cells: items.map((s, i) => cell(`${money(s.price, ar)} / ${s.priceUnit}`, i === cheaper)) },
    { label: t.fRating, Icon: Star, cells: items.map((s, i) => cell(ratingText(s), !bothUnrated && i === higher)) },
    { label: t.cmpLead, Icon: Clock, cells: items.map((s) => cell(s.minNotice || '—', false)) },
    { label: t.cmpMin, Icon: LayoutGrid, cells: items.map((s) => cell(`${s.minQuantity || 1} ${s.priceUnit}`, false)) },
    { label: t.cmpCoverage, Icon: MapPin, cells: items.map((s) => cell(s.cities.length > 3 ? `${s.cities.length} ${t.cmpCities}` : s.cities.join('، ') || '—', false)) },
    { label: t.cmpLanes, Icon: Truck, cells: items.map((s) => cell(lanes(s), false)) },
    { label: t.cmpMode, Icon: Zap, cells: items.map((s) => cell(mode(s), s.bookingMode === 'instant')) },
    { label: t.cmpCancel, Icon: ShieldCheck, cells: items.map((s) => cell(cancel(s), false)) },
    { label: t.cmpVerified, Icon: Check, cells: items.map((s) => cell(s.provider?.verified ? t.yes : t.pendingVendor, Boolean(s.provider?.verified))) },
  ];

  const bookOne = (s: ServiceItem) => {
    if (!sf.cart.some((c) => c.service.id === s.id)) sf.addToCart(s, s.minQuantity || 1);
    sf.navigate('/checkout');
  };

  return (
    <main className="max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      <Crumbs items={[{ label: t.navCatalog, onClick: () => sf.goCatalog() }, { label: t.compare }]} />
      <h1 className="mt-3.5 mb-1.5 text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.compareTitle}</h1>
      <p className="mb-6 text-sm text-ink-3">{t.compareSub}</p>

      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <div />
          {items.map((p, i) => {
            const best = i === cheaper && (bothUnrated || i === higher);
            return (
              <div key={p.id} className={cn('relative p-[18px]', i === 1 && 'border-s border-line-soft')}>
                {best ? (
                  <span className="absolute top-3.5 start-3.5 z-[2] px-2.5 py-[5px] rounded-md bg-action text-white text-[11px] font-bold">{t.bestValue}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    sf.removeFromCompare(p.id);
                    sf.goCatalog();
                  }}
                  className="absolute top-3 end-3 z-[2] h-[30px] px-2.5 rounded-lg border border-line bg-white/[.94] text-navy text-xs font-semibold min-h-0 hover:border-action"
                >
                  {t.swapItem}
                </button>
                <a
                  href={`/service/${encodeURIComponent(p.id)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    sf.goProduct(p.id);
                  }}
                  className="block aspect-[16/10] rounded-xl overflow-hidden bg-paper"
                >
                  {productPhoto(p) ? <img src={productPhoto(p)} alt="" className="w-full h-full object-cover block" /> : null}
                </a>
                <div className="text-xs text-ink-3 mt-3.5">{p.provider?.name}</div>
                <a
                  href={`/service/${encodeURIComponent(p.id)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    sf.goProduct(p.id);
                  }}
                  className="block text-[17px] font-bold mt-[3px] leading-[1.35] text-navy no-underline"
                >
                  {p.title}
                </a>
                <div className="flex items-baseline gap-1.5 mt-2.5">
                  <span className="text-[26px] font-bold tracking-[-0.02em] tnum">{money(p.price, ar)}</span>
                  <span className="text-xs text-ink-3">/ {p.priceUnit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {rows.map((r, i) => (
          <div key={r.label} className={cn('grid border-b border-line-soft', i % 2 ? 'bg-surface-2' : 'bg-surface')} style={{ gridTemplateColumns: cols }}>
            <div className="px-3 md:px-[18px] py-3.5 text-[13px] font-semibold text-ink-1 flex items-center gap-2">
              <r.Icon className="w-[15px] h-[15px] text-action shrink-0" />
              <span className="min-w-0">{r.label}</span>
            </div>
            {r.cells.map((c, j) => (
              <div
                key={j}
                className={cn(
                  'px-3 md:px-[18px] py-3.5 text-sm border-s border-line-soft flex items-center gap-1.5',
                  c.win ? 'font-bold text-navy' : 'font-medium text-ink-1',
                )}
              >
                {c.win ? (
                  <span className="w-[18px] h-[18px] rounded-[5px] bg-tint-blue text-action grid place-items-center shrink-0">
                    <Check className="w-3 h-3" aria-hidden />
                  </span>
                ) : null}
                <span className="min-w-0 break-words">{c.v}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="grid" style={{ gridTemplateColumns: cols }}>
          <div />
          {items.map((p, i) => (
            <div key={p.id} className="p-[18px] border-s border-line-soft flex flex-col gap-2">
              <button
                type="button"
                onClick={() => bookOne(p)}
                className={cn('h-[46px] rounded-control text-white text-sm font-bold flex items-center justify-center gap-2', i === 0 ? 'bg-action hover:bg-action-hover' : 'bg-navy hover:bg-navy-800')}
              >
                <Zap className="w-4 h-4" aria-hidden />
                {p.bookingMode === 'approval' ? t.requestBook : t.book}
              </button>
              <button
                type="button"
                onClick={() => sf.addToCart(p, p.minQuantity || 1)}
                className="h-[42px] rounded-control border border-navy-300 bg-surface text-navy text-[13px] font-semibold hover:border-navy"
              >
                {t.addCart}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
