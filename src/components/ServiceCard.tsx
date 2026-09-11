import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceItem } from '../types';
import { AUDIENCE_LABEL, FULFILLMENT_LANE_BY_ID } from '../data/saudiMarket';
import { Star, Plus, Check, Instagram } from 'lucide-react';
import { hasCheckoutPrice, isAllowedListingImage, listingPhotoUrls } from '../utils/catalogMedia';

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
      className="usil-product-card group relative z-[1] rounded-xl bg-white border border-[#E4E7EC] card-shadow hover:card-shadow-hover transition-all duration-200 flex flex-col overflow-hidden text-right h-full cursor-pointer touch-manipulation pointer-events-auto"
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
      <div className="relative aspect-square overflow-hidden bg-slate-100 pointer-events-none">
        {photo ? (
          <img
            src={photo}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-400">
            بدون صورة من المورّد
          </div>
        )}
        <div className="absolute top-2 start-2 flex flex-col items-start gap-1">
          {service.audience && AUDIENCE_LABEL[service.audience] ? (
            <span className="px-1.5 py-0.5 rounded bg-[#0A1A33]/90 text-white text-[10px] font-bold">
              {AUDIENCE_LABEL[service.audience]}
            </span>
          ) : null}
          {(service.fulfillment || []).slice(0, 2).map((lane) => (
            <span
              key={lane}
              className="px-1.5 py-0.5 rounded bg-[#155EEF] text-white text-[10px] font-bold"
            >
              {FULFILLMENT_LANE_BY_ID[lane]?.chip || lane}
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#155EEF] transition-colors line-clamp-2 leading-snug">
          {service.title}
        </h3>
        {service.provider?.name ? (
          <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
            <span className="truncate">{service.provider.name}</span>
            {service.provider.socials?.some((link) => link.network === 'instagram' && link.url) ? (
              <Instagram className="w-3 h-3 text-[#155EEF] shrink-0" aria-label="إنستغرام مربوط" />
            ) : null}
          </p>
        ) : null}

        {service.reviewsCount > 0 ? (
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="font-bold text-slate-900">{service.rating}</span>
            <span className="text-slate-400 font-mono">({service.reviewsCount})</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">بدون تقييم بعد</p>
        )}

        <div className="mt-auto pt-1">
          {hasCheckoutPrice(service.price) ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-[#0A1A33] font-mono">{formatPrice(service.price)}</span>
                <span className="text-[11px] text-slate-500">/ {service.priceUnit}</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-700">شامل الضريبة 15% · سعر نهائي</p>
            </>
          ) : (
            <p className="text-xs font-bold text-slate-500">هذا المنتج ما يظهر في السوق حتى يثبت المورّد السعر</p>
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
          className={`relative z-[2] mt-1 w-full min-h-[44px] h-11 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors pointer-events-auto ${
            !ready
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : isInCart
                ? 'bg-[#12B76A] text-white hover:bg-[#0E9355]'
                : 'bg-[#155EEF] hover:bg-[#0F45B5] text-white'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              في السلة
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              أضف للسلة · {service.bookingMode === 'approval' ? 'اطلب الحجز' : 'احجز الآن'}
            </>
          )}
        </button>
      </div>
    </article>
  );
};
