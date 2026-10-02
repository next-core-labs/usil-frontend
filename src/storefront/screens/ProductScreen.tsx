import React, { useEffect, useMemo, useState } from 'react';
import { Heart, ShieldCheck, MessageCircle, Star, MapPin, Clock, Check, Minus, Plus, Zap, Store } from 'lucide-react';
import type { ServiceItem } from '../../types';
import { FULFILLMENT_LANE_BY_ID, AUDIENCE_LABEL } from '../../data/saudiMarket';
import { listingPhotoUrls } from '../../utils/catalogMedia';
import { VendorSocialIcons } from '../../components/vendor/VendorSocialIcons';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money } from '../money';
import { Crumbs, Reveal } from '../primitives';
import { MiniProductCard, Rating } from '../ProductCard';
import { recordListingView } from '../../utils/trendingApi';
import { useFavorites } from '../favorites';
import { pathForVendor } from '../../utils/siteRoutes';

const SLOTS = ['10:00 – 14:00', '14:00 – 18:00', '16:00 – 20:00', '19:00 – 23:00'];

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ProductScreen() {
  const { t, ar, L, categoryName } = useLang();
  const sf = useStorefront();
  const fav = useFavorites();
  const service = useMemo(() => sf.services.find((s) => s.id === sf.productId) || null, [sf.services, sf.productId]);

  const [thumb, setThumb] = useState(0);
  const [day, setDay] = useState(1);
  const [slot, setSlot] = useState(1);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setThumb(0);
    setDay(1);
    setSlot(1);
    setQty(service?.minQuantity || 1);
    setAdded(false);
  }, [service?.id]);

  /* One signal behind «ترند هالأسبوع»: this product page was opened. */
  useEffect(() => {
    if (service?.id) recordListingView(service.id);
  }, [service?.id]);

  const days = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'short' });
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() + 1 + i);
      return { wd: fmt.format(dt), n: dt.getDate(), iso: isoDate(dt) };
    });
  }, [ar]);

  if (sf.catalogStatus === 'loading') {
    return (
      <main className="sf-wrap pt-6 pb-16" aria-busy="true">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-[clamp(24px,4vw,48px)] mt-4">
          <div className="usil-skeleton aspect-[4/3] rounded-card" />
          <div className="usil-skeleton h-[420px] rounded-card" />
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="sf-wrap pt-8 pb-16">
        <div className="py-16 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card max-w-xl mx-auto">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <Store className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{t.productMissing}</div>
          <div className="text-sm text-ink-3 mt-1.5">{t.productMissingSub}</div>
          <button type="button" onClick={() => sf.goCatalog()} className="mt-[22px] h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold">
            {t.browse}
          </button>
        </div>
      </main>
    );
  }

  const images = Array.from(new Set(listingPhotoUrls(service)));
  const main = images[Math.min(thumb, Math.max(0, images.length - 1))] || '';
  const inCart = sf.cart.some((c) => c.service.id === service.id);
  const approval = service.bookingMode === 'approval';
  const total = service.price * qty;
  const minQty = service.minQuantity || 1;
  const chosen = days[day] || days[0];
  const chosenTime = SLOTS[slot].split(' ')[0];
  const related = sf.services.filter((s) => s.id !== service.id && s.category === service.category).slice(0, 6);
  const moreRelated = related.length < 4 ? sf.services.filter((s) => s.id !== service.id && !related.includes(s)).slice(0, 4 - related.length) : [];
  const relatedAll = [...related, ...moreRelated];
  const badge = service.badge || (approval ? L('بموافقة المورّد', 'Vendor approval') : L('حجز فوري', 'Instant booking'));
  const vendorId = String(service.provider?.id || '');
  const catName = categoryName(service.category, service.categoryName);

  const add = () => {
    sf.addToCart(service, qty, chosen.iso, chosenTime, service.cities[0] || sf.selectedCity, '');
    setAdded(true);
  };
  const bookNow = () => {
    if (!inCart) sf.addToCart(service, qty, chosen.iso, chosenTime, service.cities[0] || sf.selectedCity, '');
    sf.navigate('/checkout');
  };

  return (
    <main className="sf-wrap pt-6 pb-16">
      <Crumbs
        items={[
          { label: t.navHome, onClick: sf.goHome },
          { label: catName, onClick: () => sf.goCatalog({ category: service.category, query: '' }) },
          { label: service.title },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-[clamp(24px,4vw,48px)] mt-[18px] items-start">
        <div>
          {/* Gallery */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="col-span-full relative aspect-[4/3] rounded-card overflow-hidden bg-paper border border-line">
              {main ? (
                <img src={main} alt={service.title} className="w-full h-full object-cover block" />
              ) : (
                <div className="w-full h-full grid place-items-center text-sm text-ink-3">{t.noPhoto}</div>
              )}
              <span className="absolute top-3.5 start-3.5 px-3 py-1.5 rounded-md bg-navy text-white text-xs font-bold">{badge}</span>
              <button
                type="button"
                onClick={() => fav.toggle(service.id)}
                aria-pressed={fav.has(service.id)}
                aria-label={t.mFav}
                className={cn('absolute top-3.5 end-3.5 w-10 h-10 rounded-control bg-white/[.94] grid place-items-center transition-transform hover:scale-110', fav.has(service.id) ? 'text-danger' : 'text-navy')}
              >
                <Heart className={cn('w-[18px] h-[18px]', fav.has(service.id) && 'fill-current')} aria-hidden />
              </button>
            </div>
            {images.length > 1
              ? images.slice(0, 8).map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setThumb(i)}
                    className={cn('aspect-square rounded-xl overflow-hidden p-0 border-2 bg-paper min-h-0 transition-all hover:opacity-100', i === thumb ? 'border-action opacity-100' : 'border-transparent opacity-60')}
                    aria-label={`${i + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover block" />
                  </button>
                ))
              : null}
          </div>

          {/* Details */}
          <div className="mt-8">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-[5px] rounded-md bg-tint-blue text-action text-xs font-semibold">{catName}</span>
              <span className="flex items-center gap-1 text-[13px] text-ink-3">
                <ShieldCheck className="w-[15px] h-[15px] text-action" aria-hidden />
                {vendorId ? (
                  <a
                    href={pathForVendor(vendorId)}
                    onClick={(e) => {
                      e.preventDefault();
                      sf.navigate(pathForVendor(vendorId));
                    }}
                    className="text-ink-3 no-underline hover:text-action"
                  >
                    {service.provider.name}
                  </a>
                ) : (
                  service.provider.name
                )}
                {' · '}
                {service.provider.verified ? t.verified : t.pendingVendor}
              </span>
              {sf.canMessageVendors && vendorId ? (
                <button
                  type="button"
                  onClick={() =>
                    sf.messageVendor({
                      vendorId,
                      vendorName: service.provider.name,
                      context: { type: 'listing', id: String(service.id), title: service.title },
                    })
                  }
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-navy-300 bg-surface text-action text-xs font-semibold min-h-0 hover:border-action"
                >
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                  {t.askVendor}
                </button>
              ) : null}
              {service.audience && AUDIENCE_LABEL[service.audience] ? (
                <span className="px-2.5 py-[5px] rounded-md bg-navy text-white text-xs font-semibold">{AUDIENCE_LABEL[service.audience]}</span>
              ) : null}
            </div>
            <h1 className="mt-3.5 mb-2.5 text-[clamp(26px,3.4vw,42px)] font-bold tracking-[-0.03em] leading-[1.15]">{service.title}</h1>
            <div className="flex items-center gap-3.5 flex-wrap text-sm text-ink-1">
              <Rating service={service} withCount />
              <span className="flex items-center gap-1">
                <MapPin className="w-[15px] h-[15px] text-ink-3" aria-hidden />
                {service.cities.slice(0, 2).join('، ')}
                {service.cities.length > 2 ? ` +${service.cities.length - 2}` : ''}
              </span>
              {service.minNotice ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-[15px] h-[15px] text-ink-3" aria-hidden />
                  {t.minNotice}: {service.minNotice}
                </span>
              ) : null}
              {(service.fulfillment || []).map((lane) => (
                <span key={lane} className="px-2.5 py-1 rounded-md bg-action text-white text-xs font-semibold">
                  {FULFILLMENT_LANE_BY_ID[lane]?.chip || lane}
                </span>
              ))}
            </div>
            {service.fullDesc || service.shortDesc ? (
              <p className="mt-[22px] text-[15px] leading-[1.8] text-ink-1 max-w-[680px] whitespace-pre-line">{service.fullDesc || service.shortDesc}</p>
            ) : null}

            {service.includes?.length ? (
              <div className="mt-7">
                <div className="text-[17px] font-bold mb-3">{t.pIncludes}</div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-2.5">
                  {service.includes.map((x, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-surface border border-line text-sm">
                      <span className="w-[26px] h-[26px] rounded-lg bg-tint-blue text-action grid place-items-center shrink-0">
                        <Check className="w-3.5 h-3.5" aria-hidden />
                      </span>
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {service.cities.length ? (
              <div className="mt-7">
                <div className="text-[17px] font-bold mb-3">{t.pCoverage}</div>
                <div className="flex flex-wrap gap-2">
                  {service.cities.map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-control bg-surface border border-line text-sm text-ink-1">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Vendor box with socials */}
            <div className="mt-7 p-[18px] rounded-card bg-surface border border-line flex items-center gap-3.5 flex-wrap">
              {service.provider.avatar ? (
                <img src={service.provider.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <span className="w-12 h-12 rounded-xl bg-navy text-white grid place-items-center">
                  <Store className="w-5 h-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold flex items-center gap-1.5">
                  {service.provider.name}
                  {service.provider.verified ? <ShieldCheck className="w-4 h-4 text-action" aria-hidden /> : null}
                </div>
                <div className="text-xs text-ink-3 mt-0.5">{service.provider.verified ? t.verified : t.pendingVendor}</div>
                {service.provider.socials?.length ? (
                  <div className="mt-2">
                    <VendorSocialIcons links={service.provider.socials} />
                  </div>
                ) : null}
              </div>
              {vendorId ? (
                <button
                  type="button"
                  onClick={() => sf.navigate(pathForVendor(vendorId))}
                  className="h-10 px-3.5 rounded-control border border-navy-300 bg-surface text-navy text-[13px] font-semibold hover:border-navy"
                >
                  {t.vendorPage}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Price box */}
        <aside className="md:sticky md:top-[84px] bg-surface border border-line rounded-card p-[22px]">
          <div className="flex items-end gap-1.5">
            <span className="text-[34px] font-bold tracking-[-0.03em] leading-none tnum">{money(service.price, ar)}</span>
            <span className="text-[13px] text-ink-3 pb-[3px]">/ {service.priceUnit}</span>
          </div>
          <div className="text-xs font-medium text-success mt-1.5">{t.vatIncluded}</div>

          <div className="mt-5 text-[13px] font-semibold">{t.date}</div>
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none" role="radiogroup" aria-label={t.date}>
            {days.map((d, i) => {
              const on = day === i;
              return (
                <button
                  key={d.iso}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDay(i)}
                  className={cn(
                    'flex-none min-w-[60px] px-2 py-2.5 rounded-control border-[1.5px] text-center transition-all min-h-0',
                    on ? 'bg-action border-action text-white' : 'bg-surface border-line text-navy hover:border-action',
                  )}
                >
                  <span className="block text-[11px] opacity-75">{d.wd}</span>
                  <span className="block text-lg font-bold mt-0.5 tnum">{d.n}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-[13px] font-semibold">{t.time}</div>
          <div className="grid grid-cols-2 gap-2 mt-2" role="radiogroup" aria-label={t.time}>
            {SLOTS.map((s, i) => {
              const on = slot === i;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSlot(i)}
                  dir="ltr"
                  className={cn('h-10 rounded-control border-[1.5px] text-[13px] font-medium transition-all min-h-0 tnum', on ? 'bg-action border-action text-white' : 'bg-surface border-line text-navy hover:border-action')}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-[13px] font-semibold">
              {t.qty} <span className="text-ink-3 font-normal">({service.priceUnit})</span>
            </span>
            <div className="flex items-center gap-1 border border-line rounded-control p-[3px]">
              <button type="button" onClick={() => setQty((q) => Math.max(minQty, q - 1))} className="w-8 h-8 rounded-lg bg-paper grid place-items-center min-h-0" aria-label="−">
                <Minus className="w-3.5 h-3.5" aria-hidden />
              </button>
              <span className="min-w-7 text-center font-bold text-[15px] tnum">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="w-8 h-8 rounded-lg bg-navy text-white grid place-items-center min-h-0" aria-label="+">
                <Plus className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-[18px] pt-4 border-t border-dashed border-navy-300">
            <span className="text-sm text-ink-1">{t.total}</span>
            <span className="text-xl font-bold tnum">{money(total, ar)}</span>
          </div>

          <button
            type="button"
            onClick={bookNow}
            className="w-full mt-3.5 h-[52px] rounded-xl bg-action text-white text-base font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:bg-action-hover"
          >
            <Zap className="w-[18px] h-[18px]" aria-hidden />
            {approval ? t.requestBook : t.book}
          </button>
          {added || inCart ? (
            <button
              type="button"
              onClick={() => sf.navigate('/cart')}
              className="w-full mt-2 h-12 rounded-xl bg-success-bg text-success text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" aria-hidden />
              {t.added} · {t.goToCart}
            </button>
          ) : (
            <button type="button" onClick={add} className="w-full mt-2 h-12 rounded-xl border border-navy-300 bg-surface text-navy text-[15px] font-semibold transition-colors hover:border-navy">
              {t.addCart}
            </button>
          )}

          <div className="mt-3.5 text-xs text-ink-1 leading-relaxed text-center">{approval ? t.bookingModeApproval : t.bookingModeInstant}</div>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-success">
            <Check className="w-3.5 h-3.5" aria-hidden />
            {t.freeCancel}
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-1.5 text-center text-[11px]">
            {[
              { pct: '100%', label: t.refund100 },
              { pct: '50%', label: t.refund50 },
              { pct: '0%', label: t.refund0 },
            ].map((r) => (
              <div key={r.pct} className="rounded-control bg-paper px-1 py-2">
                <div className="font-bold text-navy text-sm tnum">{r.pct}</div>
                <div className="text-ink-3 mt-0.5">{r.label}</div>
              </div>
            ))}
          </div>
          <a
            href="/refund"
            onClick={(e) => {
              e.preventDefault();
              sf.navigate('/refund');
            }}
            className="block mt-2 text-center text-xs text-action no-underline hover:underline min-h-0"
          >
            {t.refundTiers}
          </a>
        </aside>
      </div>

      {relatedAll.length ? (
        <div className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-[18px]">
            <h2 className="text-[clamp(22px,3vw,30px)] font-bold tracking-[-0.03em]">{t.related}</h2>
            <a
              href="/catalog"
              onClick={(e) => {
                e.preventDefault();
                sf.goCatalog({ category: service.category, query: '' });
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-navy no-underline border-b-2 border-action min-h-0"
            >
              {t.viewAll}
            </a>
          </div>
          <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pt-1.5 pb-4 scrollbar-none">
            {relatedAll.map((p) => (
              <MiniProductCard key={p.id} service={p} onOpen={(s) => sf.goProduct(s.id)} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
