import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceItem } from '../types';
import { AUDIENCE_LABEL, FULFILLMENT_LANE_BY_ID } from '../data/saudiMarket';
import { Star, Plus, Check, Instagram } from 'lucide-react';
import { hasCheckoutPrice, isAllowedListingImage, listingPhotoUrls } from '../utils/catalogMedia';
import { cn } from './ui/cn';

interface ServiceCardProps {
  service: ServiceItem;
  onOpenDetails: (service: ServiceItem) => void;
  onAddToCart: (service: ServiceItem) => void;
  isInCart: boolean;
  onToggleCompare?: (service: ServiceItem) => void;
  isCompared?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onOpenDetails,
  onAddToCart,
  isInCart,
}) => {
  const { formatPrice } = useCurrency();
  const photo = listingPhotoUrls(service)[0] || (isAllowedListingImage(service.image) ? service.image : '');
  const ready = hasCheckoutPrice(service.price) && Boolean(photo);

  return (
    <article
      className={cn(
        'usil-product-card group relative z-[1] rounded-card bg-surface border border-line',
        'shadow-e1 hover:shadow-e3 hover:border-navy-300 transition-all duration-200',
        'flex flex-col overflow-hidden text-right h-full cursor-pointer touch-manipulation pointer-events-auto',
        'focus-within:shadow-e3',
      )}
      onClick={() => onOpenDetails(service)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(service);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`تفاصيل ${service.title}`}
    >
      <div className="relative aspect-square overflow-hidden bg-line-soft pointer-events-none">
        {photo ? (
          <img
            src={photo}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted px-4 text-center">
            بدون صورة من المورّد
          </div>
        )}

        {/* Audience and lane markers. Capped at two lanes so a busy listing
            cannot bury the image under a column of chips. */}
        <div className="absolute top-2 start-2 flex flex-col items-start gap-1">
          {service.audience && AUDIENCE_LABEL[service.audience] ? (
            <span className="px-2 py-0.5 rounded-full bg-navy/90 text-white text-2xs font-medium backdrop-blur-sm">
              {AUDIENCE_LABEL[service.audience]}
            </span>
          ) : null}
          {(service.fulfillment || []).slice(0, 2).map((lane) => (
            <span
              key={lane}
              className="px-2 py-0.5 rounded-full bg-action text-white text-2xs font-medium"
            >
              {FULFILLMENT_LANE_BY_ID[lane]?.chip || lane}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink group-hover:text-action transition-colors line-clamp-2 leading-snug">
          {service.title}
        </h3>

        {service.provider?.name ? (
          <p className="text-xs text-ink-3 line-clamp-1 flex items-center gap-1">
            <span className="truncate">{service.provider.name}</span>
            {service.provider.socials?.some((link) => link.network === 'instagram' && link.url) ? (
              <Instagram className="w-3.5 h-3.5 text-action shrink-0" aria-label="إنستغرام مربوط" />
            ) : null}
          </p>
        ) : null}

        {service.reviewsCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="w-3.5 h-3.5 fill-warning text-warning shrink-0" aria-hidden />
            <span className="font-semibold text-ink tnum">{service.rating}</span>
            <span className="text-muted tnum">({service.reviewsCount})</span>
          </div>
        ) : (
          <p className="text-xs text-muted">بدون تقييم بعد</p>
        )}

        <div className="mt-auto pt-1.5">
          {hasCheckoutPrice(service.price) ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-navy tnum">
                  {formatPrice(service.price)}
                </span>
                <span className="text-xs text-ink-3">/ {service.priceUnit}</span>
              </div>
              <p className="text-2xs font-medium text-success mt-0.5">
                شامل الضريبة 15% · سعر نهائي
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-3 leading-relaxed">
              هذا المنتج ما يظهر في السوق حتى يثبت المورّد السعر
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={(event) => {
            event.stopPropagation();
            if (!ready) return;
            onAddToCart(service);
          }}
          aria-label={
            isInCart
              ? `${service.title} في السلة`
              : `أضف ${service.title} للسلة`
          }
          className={cn(
            'relative z-[2] mt-1 w-full min-h-11 h-11 rounded-control font-semibold text-xs',
            'flex items-center justify-center gap-1.5 transition-colors pointer-events-auto',
            !ready
              ? 'bg-line-soft text-muted cursor-not-allowed'
              : isInCart
                ? 'bg-success text-white hover:brightness-110'
                : 'bg-action hover:bg-action-hover text-white',
          )}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" aria-hidden />
              في السلة
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden />
              أضف للسلة · {service.bookingMode === 'approval' ? 'اطلب الحجز' : 'احجز الآن'}
            </>
          )}
        </button>
      </div>
    </article>
  );
};
