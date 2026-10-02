import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LayoutGrid, MapPin, Wallet, Users, Truck, ChevronDown, RotateCcw, Check, ArrowUpDown } from 'lucide-react';
import type { ServiceItem } from '../../types';
import { CATEGORIES } from '../../data/services';
import {
  AUDIENCE_OPTIONS,
  PRICE_RANGES,
  FULFILLMENT_FILTER_CHIPS,
  serviceMatchesSearch,
  serviceMatchesPriceRange,
  serviceMatchesFulfillment,
  CATALOG_SEARCH_CHIPS,
  type FulfillmentFilter,
} from '../../data/saudiMarket';
import { cityFilterMatches, ALL_CITIES_LABEL } from '../../data/saudiPlaces';
import { CityDemandForm } from '../../components/CityDemandForm';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { formatCount } from '../money';
import { Crumbs, Reveal, useIsMobile } from '../primitives';
import { ProductCard } from '../ProductCard';
import { useFavorites } from '../favorites';
import { categoryTint, CategoryIcon } from './HomeScreen';
import { fill } from '../copy';
import { trendingTopIds } from '../../utils/trendingApi';

const PAGE_SIZE = 24;

const DEMAND_OCCASION_FOR_CATEGORY: Record<string, string> = {
  hospitality: 'ضيافة وقهوة',
  buffet: 'بوفيه ومأكولات',
  photography: 'تصوير وتوثيق',
  halls: 'قاعة أو استراحة',
  condolence: 'عزاء',
};

/** Shared filter + sort used by the catalog screen (and the home page counts). */
export function filterServices(services: ServiceItem[], f: {
  category: string;
  city: string;
  audience: string;
  query: string;
  price: string;
  lane: FulfillmentFilter;
  sort: string;
  /** This week's trending score per listing id; «الأكثر طلباً» sorts by it first. */
  popularity?: Map<string, number>;
}): ServiceItem[] {
  const pop = (item: ServiceItem) => f.popularity?.get(item.id) || 0;
  return services
    .filter((item) => {
      if (f.category !== 'all' && item.category !== f.category) return false;
      if (!cityFilterMatches(item.cities, f.city)) return false;
      if (f.audience !== 'all') {
        const a = item.audience || 'family';
        const exact = a === f.audience;
        const familyFits = a === 'family' && (f.audience === 'women' || f.audience === 'men');
        if (!exact && !familyFits) return false;
      }
      if (f.query.trim() && !serviceMatchesSearch(item, f.query)) return false;
      if (!serviceMatchesPriceRange(item.price, f.price)) return false;
      if (!serviceMatchesFulfillment(item, f.lane)) return false;
      return true;
    })
    .sort((a, b) => {
      if (f.sort === 'rating') return b.rating - a.rating;
      if (f.sort === 'price-asc') return a.price - b.price;
      if (f.sort === 'price-desc') return b.price - a.price;
      return pop(b) - pop(a) || b.reviewsCount - a.reviewsCount;
    });
}

/** Dropdown filter button (city, price, audience, lane, sort) from the sticky row. */
function FilterMenu({
  icon: Icon,
  label,
  value,
  active,
  options,
  onPick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  active: boolean;
  options: Array<{ id: string; label: string }>;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex items-center gap-1.5 h-[38px] px-3.5 rounded-control border text-[13px] font-semibold whitespace-nowrap min-h-0 transition-colors hover:border-action',
          active ? 'bg-navy border-navy text-white' : 'bg-surface border-line text-navy',
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {value ? `${label}: ${value}` : label}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-full mt-1.5 start-0 z-50 min-w-[200px] max-h-72 overflow-y-auto rounded-card bg-surface border border-line shadow-e3 p-1.5 usil-pop-in"
        >
          {options.map((opt) => {
            const selected = opt.label === value || (!value && opt.id === 'all');
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onPick(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-control text-sm text-start min-h-0 transition-colors',
                    selected ? 'bg-action-100 text-action font-semibold' : 'text-navy hover:bg-paper',
                  )}
                >
                  {opt.label}
                  {selected ? <Check className="w-4 h-4" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function CatalogScreen() {
  const { t, ar, L, categoryName } = useLang();
  const sf = useStorefront();
  const mobile = useIsMobile();
  const fav = useFavorites();
  const f = sf.filters;
  const [query, setQuery] = useState(f.query);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => setQuery(f.query), [f.query]);
  useEffect(() => setShown(PAGE_SIZE), [f.category, f.audience, f.query, f.price, f.lane, f.sort, sf.selectedCity]);

  const popularity = useMemo(
    () => new Map(sf.trending.map((row) => [row.id, row.trending.score] as const)),
    [sf.trending],
  );
  const trendingIds = useMemo(() => trendingTopIds(sf.trending), [sf.trending]);
  const results = useMemo(
    () => filterServices(sf.services, { ...f, city: sf.selectedCity, popularity }),
    [sf.services, f, sf.selectedCity, popularity],
  );
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sf.services) map[s.category] = (map[s.category] || 0) + 1;
    return map;
  }, [sf.services]);

  const cityLabel = sf.selectedCity === ALL_CITIES_LABEL || !sf.selectedCity ? t.allRegions : sf.selectedCity;
  const activeCat = CATEGORIES.find((c) => c.id === f.category);
  const heading = f.category === 'all' ? t.catTitle : categoryName(f.category, activeCat?.name || '');
  const visible = results.slice(0, shown);

  const activeCount =
    (f.category !== 'all' ? 1 : 0) +
    (sf.selectedCity && sf.selectedCity !== ALL_CITIES_LABEL ? 1 : 0) +
    (f.audience !== 'all' ? 1 : 0) +
    (f.price !== 'all' ? 1 : 0) +
    (f.lane !== 'all' ? 1 : 0) +
    (f.query.trim() ? 1 : 0);

  const audienceLabel = (id: string) => {
    const opt = AUDIENCE_OPTIONS.find((o) => o.id === id);
    if (!opt) return id;
    if (ar) return opt.label;
    return { all: 'All', women: 'Women', men: 'Men', family: 'Family', corporate: 'Corporate' }[id] || opt.label;
  };
  const priceLabel = (id: string) => {
    const opt = PRICE_RANGES.find((o) => o.id === id);
    if (!opt) return id;
    if (ar) return opt.label;
    return { all: 'All prices', lt1000: 'Under 1,000 SAR', '1k3k': '1,000 – 3,000 SAR', '3k8k': '3,000 – 8,000 SAR', gt8000: 'Over 8,000 SAR' }[id] || opt.label;
  };
  const laneLabel = (id: string) => {
    const opt = FULFILLMENT_FILTER_CHIPS.find((o) => o.id === id);
    if (!opt) return id;
    if (ar) return opt.chip;
    return { all: 'All', hour: 'Within the hour', same_day: 'Same day', tomorrow: 'Tomorrow', instant: 'Instant booking' }[id] || opt.chip;
  };
  const sortLabel = (id: string) =>
    ({ popular: t.sortPopular, rating: t.sortRating, 'price-asc': t.sortPriceAsc, 'price-desc': t.sortPriceDesc } as Record<string, string>)[id] || id;

  return (
    <main>
      {/* Navy header with breadcrumb, heading, count, search and the category chip rail. */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="absolute -end-[120px] -top-[140px] w-[420px] h-[420px] rounded-full border-[90px] border-action/25 pointer-events-none" />
        <div className="relative sf-wrap pt-7">
          <Crumbs tone="dark" items={[{ label: t.navHome, onClick: sf.goHome }, { label: f.category === 'all' ? t.navCatalog : heading }]} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5 items-end mt-[18px]">
            <div>
              <h1 className="text-[clamp(32px,4.6vw,56px)] font-bold tracking-[-0.03em] leading-[1.05]">{heading}</h1>
              <div className="text-sm text-on-navy-muted mt-2 tnum">
                {formatCount(results.length)} {t.catCount} {t.catIn} {cityLabel}
              </div>
            </div>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                sf.setFilters({ query: query.trim() });
              }}
              className="flex items-center gap-1 p-[5px] rounded-[14px] bg-surface max-w-[560px] w-full justify-self-end"
            >
              <span className="flex items-center px-3 text-action">
                <Search className="w-[18px] h-[18px]" aria-hidden />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPh}
                list="sf-catalog-suggest"
                aria-label={t.searchBtn}
                className="flex-1 min-w-0 h-11 border-0 outline-none bg-transparent text-[15px] text-navy placeholder:text-muted"
              />
              <datalist id="sf-catalog-suggest">
                {CATALOG_SEARCH_CHIPS.map((chip) => (
                  <option key={chip} value={chip} />
                ))}
              </datalist>
              <button type="submit" className="h-11 px-[18px] rounded-control bg-navy text-white text-sm font-semibold min-h-0">
                {t.searchBtn}
              </button>
            </form>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pt-[26px] pb-[22px] mt-1.5" role="group" aria-label={t.secCatsKicker}>
            {[{ id: 'all', name: t.all, icon: 'All', count: sf.services.length }, ...CATEGORIES.filter((c) => c.id !== 'all').map((c, i) => ({ id: c.id, name: categoryName(c.id, c.name), icon: c.icon, count: counts[c.id] || 0, tint: categoryTint(i) }))].map(
              (c: any) => {
                const on = f.category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => sf.setFilters({ category: c.id })}
                    className={cn(
                      'flex-none flex items-center gap-2.5 h-12 ps-1.5 pe-4 py-[5px] rounded-xl border text-sm font-semibold text-white whitespace-nowrap min-h-0 transition-all hover:-translate-y-0.5',
                      on ? 'bg-action border-action' : 'bg-white/[.06] border-white/[.14]',
                    )}
                  >
                    <span
                      className={cn('w-9 h-9 rounded-[9px] grid place-items-center shrink-0', c.id === 'all' ? (on ? 'bg-white text-action' : 'bg-action text-white') : 'text-navy')}
                      style={c.id === 'all' ? undefined : { background: c.tint }}
                    >
                      {c.id === 'all' ? <LayoutGrid className="w-4 h-4" aria-hidden /> : <CategoryIcon icon={c.icon} className="w-4 h-4" />}
                    </span>
                    {c.name}
                    <span className="text-xs font-medium opacity-70 tnum">{formatCount(c.count)}</span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Sticky filter row */}
      <div className="sticky top-[68px] z-40 bg-paper/[.92] backdrop-blur-xl border-b border-line">
        <div className="sf-wrap py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={sf.openRegionPicker}
            className={cn(
              'flex items-center gap-1.5 h-[38px] px-3.5 rounded-control border text-[13px] font-semibold whitespace-nowrap min-h-0 shrink-0 transition-colors hover:border-action',
              sf.selectedCity && sf.selectedCity !== ALL_CITIES_LABEL ? 'bg-navy border-navy text-white' : 'bg-surface border-line text-navy',
            )}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            {t.fCity}: {cityLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden />
          </button>
          <FilterMenu
            icon={Wallet}
            label={t.fPrice}
            value={f.price !== 'all' ? priceLabel(f.price) : undefined}
            active={f.price !== 'all'}
            options={PRICE_RANGES.map((r) => ({ id: r.id, label: priceLabel(r.id) }))}
            onPick={(id) => sf.setFilters({ price: id })}
          />
          <FilterMenu
            icon={Users}
            label={t.fAudience}
            value={f.audience !== 'all' ? audienceLabel(f.audience) : undefined}
            active={f.audience !== 'all'}
            options={AUDIENCE_OPTIONS.map((o) => ({ id: o.id, label: audienceLabel(o.id) }))}
            onPick={(id) => sf.setFilters({ audience: id })}
          />
          <FilterMenu
            icon={Truck}
            label={t.fLane}
            value={f.lane !== 'all' ? laneLabel(f.lane) : undefined}
            active={f.lane !== 'all'}
            options={FULFILLMENT_FILTER_CHIPS.map((c) => ({ id: c.id, label: laneLabel(c.id) }))}
            onPick={(id) => sf.setFilters({ lane: id as FulfillmentFilter })}
          />
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                sf.clearFilters();
                setQuery('');
              }}
              className="flex items-center gap-1.5 h-[38px] px-3 rounded-control text-[13px] font-semibold text-ink-3 whitespace-nowrap min-h-0 hover:text-action shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
              {t.reset}
            </button>
          ) : null}
          <span className="flex-1" />
          <FilterMenu
            icon={ArrowUpDown}
            label={sortLabel(f.sort)}
            active={false}
            options={['popular', 'rating', 'price-asc', 'price-desc'].map((id) => ({ id, label: sortLabel(id) }))}
            onPick={(id) => sf.setFilters({ sort: id })}
          />
        </div>
      </div>

      <section className="sf-wrap pt-7 pb-16" id="services-section">
        {sf.catalogStatus === 'loading' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-3.5" aria-busy="true" aria-label={t.loading}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-line bg-surface overflow-hidden">
                <div className="usil-skeleton aspect-[4/3]" />
                <div className="p-4 space-y-2.5">
                  <div className="usil-skeleton h-3 w-24 rounded" />
                  <div className="usil-skeleton h-4 w-3/4 rounded" />
                  <div className="usil-skeleton h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sf.catalogStatus === 'error' ? (
          <div role="alert" className="py-16 px-6 text-center bg-surface border border-danger-border rounded-card">
            <div className="text-xl font-bold">{t.catalogError}</div>
            <div className="text-sm text-ink-3 mt-1.5">{t.catalogErrorSub}</div>
            <button type="button" onClick={sf.retryCatalog} className="mt-5 h-12 px-6 rounded-xl bg-action text-white text-[15px] font-semibold hover:bg-action-hover">
              {t.retry}
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
            <div className="text-xl font-bold">{sf.services.length === 0 ? t.emptyMarket : t.noResults}</div>
            <div className="text-sm text-ink-3 mt-1.5 max-w-xl mx-auto leading-relaxed">
              {sf.services.length === 0 ? t.emptyMarketSub : t.noResultsSub}
            </div>
            {activeCount > 0 && sf.services.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  sf.clearFilters();
                  setQuery('');
                }}
                className="mt-5 h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden />
                {t.clearFilters}
              </button>
            ) : null}
            <div className="mt-8 text-start">
              <CityDemandForm
                city={sf.selectedCity}
                onCityChange={sf.setSelectedCity}
                defaultOccasion={DEMAND_OCCASION_FOR_CATEGORY[f.category] || 'عرس'}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] [grid-auto-flow:dense] gap-3.5">
              {visible.map((p, i) => {
                const featured = !mobile && results.length > 4 && i % 7 === 0;
                return (
                  <Reveal key={p.id} delay={(i % 6) * 70} className={cn(featured && 'md:col-span-2')}>
                    <ProductCard
                      service={p}
                      featured={featured}
                      onOpen={(s) => sf.goProduct(s.id)}
                      badge={trendingIds.has(p.id) ? t.trendingBadge : p.badge || (p.bookingMode === 'instant' ? L('حجز فوري', 'Instant') : false)}
                      compared={sf.compared.some((c) => c.id === p.id)}
                      onToggleCompare={sf.toggleCompare}
                      favorite={fav.has(p.id)}
                      onToggleFavorite={fav.toggle}
                      className="h-full"
                    />
                  </Reveal>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-2.5 mt-10">
              <div className="text-[13px] text-ink-3 tnum">{fill(t.showing, { shown: formatCount(visible.length), total: formatCount(results.length) })}</div>
              <div className="w-[200px] h-1 rounded-sm bg-line overflow-hidden">
                <div className="h-full bg-action" style={{ width: `${Math.max(4, Math.min(100, Math.round((visible.length / results.length) * 100)))}%` }} />
              </div>
              {visible.length < results.length ? (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="mt-1.5 h-12 px-7 rounded-xl border border-navy bg-surface text-navy text-[15px] font-semibold transition-colors hover:bg-navy hover:text-white"
                >
                  {t.loadMore}
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
