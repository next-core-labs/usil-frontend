import React from 'react';
import { Heart, Scale, ShieldCheck, Star } from 'lucide-react';
import type { ServiceItem } from '../types';
import { cn } from '../components/ui/cn';
import { hasCheckoutPrice, listingPhotoUrls } from '../utils/catalogMedia';
import { FULFILLMENT_LANE_BY_ID } from '../data/saudiMarket';
import { useLang } from './lang';
import { money } from './money';
import { ArrowIcon } from './primitives';

export type ProductCardProps = {
  service: ServiceItem;
  onOpen: (service: ServiceItem) => void;
  /** Featured cards span two columns with the photo as a dark backdrop. */
  featured?: boolean;
  badge?: string | false;
  compared?: boolean;
  onToggleCompare?: (service: ServiceItem) => void;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  className?: string;
  /** Rank for the compact row variant. */
  compact?: boolean;
};

export function productPhoto(service: ServiceItem): string {
  return listingPhotoUrls(service)[0] || '';
}

/** Rating or the honest «بدون تقييم بعد». */
export function Rating({ service, tone = 'light', withCount }: { service: ServiceItem; tone?: 'light' | 'dark'; withCount?: boolean }) {
  const { t } = useLang();
  if (!service.reviewsCount) {
    return <span className={cn('text-xs', tone === 'dark' ? 'text-on-navy-soft' : 'text-ink-3')}>{t.noRatingYet}</span>;
  }
  return (
    <span className={cn('flex items-center gap-1 text-xs font-semibold tnum', tone === 'dark' ? 'text-white' : 'text-ink-1')}>
      <Star className={cn('w-3.5 h-3.5 fill-current', tone === 'dark' ? 'text-sky' : 'text-action')} aria-hidden />
      {service.rating.toFixed(1)}
      {withCount ? <span className={cn('font-normal', tone === 'dark' ? 'text-on-navy-soft' : 'text-ink-3')}>({service.reviewsCount})</span> : null}
    </span>
  );
}

/**
 * Catalog card from the design. Regular: 4:3 photo with the price tag on the
 * image, vendor + rating row, two-line title, category and «احجز الآن» link.
 * Featured: photo backdrop with a navy gradient and large type.
 */
export function ProductCard({
  service,
  onOpen,
  featured = false,
  badge,
  compared = false,
  onToggleCompare,
  favorite = false,
  onToggleFavorite,
  className,
}: ProductCardProps) {
  const { t, ar, categoryName } = useLang();
  const photo = productPhoto(service);
  const price = hasCheckoutPrice(service.price) ? money(service.price, ar) : '';
  const cta = service.bookingMode === 'approval' ? t.requestBook : t.book;
  const lanes = (service.fulfillment || []).slice(0, 2);

  const actions = (
    <div className="absolute top-3 end-3 z-[3] flex gap-1.5">
      {onToggleCompare ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(service);
          }}
          title={t.compare}
          aria-pressed={compared}
          aria-label={`${t.compare}: ${service.title}`}
          className={cn(
            'w-[34px] h-[34px] min-h-0 rounded-control grid place-items-center border transition-transform hover:scale-110',
            compared ? 'bg-action border-action text-white' : 'bg-white/95 border-transparent text-navy',
          )}
        >
          <Scale className="w-4 h-4" aria-hidden />
        </button>
      ) : null}
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(service.id);
          }}
          aria-pressed={favorite}
          aria-label={`${t.mFav}: ${service.title}`}
          className={cn(
            'w-[34px] h-[34px] min-h-0 rounded-control grid place-items-center bg-white/95 transition-transform hover:scale-110',
            favorite ? 'text-danger' : 'text-navy',
          )}
        >
          <Heart className={cn('w-4 h-4', favorite && 'fill-current')} aria-hidden />
        </button>
      ) : null}
    </div>
  );

  const badgeEl = badge ? (
    <span className="absolute top-3 start-3 z-[3] px-2.5 py-1.5 rounded-[7px] bg-action text-white text-[11px] font-bold">{badge}</span>
  ) : null;

  if (featured) {
    return (
      <a
        href={`/service/${encodeURIComponent(service.id)}`}
        onClick={(e) => {
          e.preventDefault();
          onOpen(service);
        }}
        className={cn(
          'usil-product-card relative flex flex-col min-h-full no-underline text-white bg-navy-700 border border-line rounded-[18px] overflow-hidden cursor-pointer transition-shadow hover:shadow-e3 hover:border-action',
          'col-span-1 md:col-span-2',
          className,
        )}
      >
        {actions}
        {badgeEl}
        <div className="aspect-[2/1] min-h-full" />
        {photo ? <img src={photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,26,51,0)_40%,rgba(10,26,51,.94)_100%)]" />
        <div className="relative mt-auto p-[clamp(18px,2.6vw,28px)]">
          <div className="flex items-center gap-1.5 text-xs text-on-navy-soft">
            <ShieldCheck className="w-3.5 h-3.5 text-sky" aria-hidden />
            {service.provider?.name}
          </div>
          <div className="text-[clamp(20px,2.2vw,28px)] font-bold tracking-[-0.02em] leading-[1.2] mt-1.5 sf-balance">{service.title}</div>
          <div className="flex items-center justify-between gap-3 mt-3.5 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-on-navy-soft">{t.from}</span>
              <span className="text-2xl font-bold tnum">{price}</span>
            </div>
            <Rating service={service} tone="dark" withCount />
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={`/service/${encodeURIComponent(service.id)}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen(service);
      }}
      className={cn(
        'usil-product-card relative flex flex-col min-h-full no-underline text-navy bg-surface border border-line rounded-[18px] overflow-hidden cursor-pointer transition-shadow hover:shadow-e3 hover:border-action',
        className,
      )}
    >
      {actions}
      {badgeEl}
      <div className="relative aspect-[4/3] bg-paper">
        {photo ? (
          <img src={photo} alt={service.title} loading="lazy" className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-ink-3 px-4 text-center">{t.noPhoto}</div>
        )}
        {price ? (
          <span className="absolute bottom-2.5 start-2.5 px-2.5 py-1.5 rounded-lg bg-navy text-white text-[13px] font-bold whitespace-nowrap tnum">{price}</span>
        ) : null}
        {lanes.length ? (
          <span className="absolute bottom-2.5 end-2.5 flex gap-1">
            {lanes.map((lane) => (
              <span key={lane} className="px-2 py-1 rounded-md bg-white/95 text-navy text-[11px] font-semibold">
                {FULFILLMENT_LANE_BY_ID[lane]?.chip || lane}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-ink-3 min-w-0 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-action shrink-0" aria-hidden />
            <span className="truncate">{service.provider?.name}</span>
          </span>
          <Rating service={service} />
        </div>
        <div className="text-[15px] font-semibold mt-1.5 leading-[1.4] line-clamp-2">{service.title}</div>
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-xs text-ink-3 truncate">{categoryName(service.category, service.categoryName)}</span>
          <span className="flex items-center gap-1 text-[13px] font-bold text-action whitespace-nowrap">
            {cta}
            <ArrowIcon className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

/** Small square card for horizontal "related" rails (220px wide, 1:1 photo). */
export function MiniProductCard({ service, onOpen }: { service: ServiceItem; onOpen: (s: ServiceItem) => void }) {
  const { ar } = useLang();
  const photo = productPhoto(service);
  return (
    <a
      href={`/service/${encodeURIComponent(service.id)}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen(service);
      }}
      className="flex-none w-[220px] snap-start block no-underline text-navy bg-surface border border-line rounded-card overflow-hidden transition-all hover:-translate-y-1.5 hover:shadow-e3"
    >
      <div className="aspect-square bg-paper">
        {photo ? <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover block" /> : null}
      </div>
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="text-xs text-ink-3 truncate">{service.provider?.name}</div>
        <div className="text-sm font-semibold mt-0.5 leading-[1.4] line-clamp-2 min-h-10">{service.title}</div>
        <div className="text-[15px] font-bold mt-2 tnum">{money(service.price, ar)}</div>
      </div>
    </a>
  );
}
