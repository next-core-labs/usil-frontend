import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Zap,
  Heart,
  GraduationCap,
  Cake,
  Utensils,
  Moon,
  Briefcase,
  Headset,
  Download,
  Star,
  ShieldCheck,
  Coffee,
  Palette,
  Camera,
  PartyPopper,
  Building2,
  Armchair,
  Users,
  Speaker,
  Tent,
  Music,
  Gift,
  Car,
  Flower2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ServiceItem } from '../../types';
import { CATEGORIES } from '../../data/services';
import { OCCASION_PACKAGES, CATALOG_SEARCH_CHIPS } from '../../data/saudiMarket';
import { SAUDI_REGIONS, ALL_CITIES_LABEL } from '../../data/saudiPlaces';
import { TESTIMONIALS } from '../../data/services';
import { PARTNER_LOGOS, APP_STORE_URL, PLAY_STORE_URL } from '../../data/marketing';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money, formatCount } from '../money';
import { ArrowIcon, ArrowLink, Blobs, Marquee, Reveal, SectionHead, ChevronForward, InitialAvatar } from '../primitives';
import { productPhoto, Rating } from '../ProductCard';
import { countPhrase, fill } from '../copy';
import { TRENDING_SHELF_MIN, TRENDING_SHELF_SIZE, trendingShelf, type TrendingShelfItem } from '../../utils/trendingApi';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Coffee,
  Utensils,
  Palette,
  Camera,
  PartyPopper,
  Building2,
  Armchair,
  Users,
  Speaker,
  Tent,
  Music,
  Cake,
  Gift,
  Car,
  Flower2,
};

/** Pastel tile tints from the design, cycled across the 15 real categories. */
export const CATEGORY_TINTS = ['#DBE7FF', '#FFE8D6', '#FDE2E4', '#D6F5E3', '#FFF3C4', '#D9F0FF', '#E9EDF5'];
export function categoryTint(index: number) {
  return CATEGORY_TINTS[index % CATEGORY_TINTS.length];
}
export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] || Sparkles;
  return <Icon className={className} aria-hidden />;
}

const OCCASION_ICONS: Record<string, LucideIcon> = {
  wedding: Heart,
  graduation: GraduationCap,
  malakah: Cake,
  corporate: Briefcase,
  ramadan: Moon,
  condolence: Utensils,
};
const OCCASION_TINTS: Record<string, string> = {
  wedding: '#FDE2E4',
  graduation: '#DBE7FF',
  malakah: '#FFE8D6',
  corporate: '#D9F0FF',
  ramadan: '#FFF3C4',
  condolence: '#D6F5E3',
};
const OCCASION_EN: Record<string, { name: string; sub: string }> = {
  wedding: { name: 'Weddings', sub: 'Hospitality, buffet, photo' },
  graduation: { name: 'Graduations', sub: 'Décor, hospitality, photo' },
  malakah: { name: 'Milcha', sub: "Women's hospitality & sweets" },
  corporate: { name: 'Conference / launch', sub: 'Hall, VAT invoice, crew' },
  ramadan: { name: 'Ramadan reception', sub: 'Coffee, dates, iftar buffet' },
  condolence: { name: 'Condolence', sub: 'Chairs, rugs, coffee & dates' },
};

export function HomeScreen() {
  const { t, ar, L, categoryName } = useLang();
  const sf = useStorefront();
  const [query, setQuery] = useState('');
  const services = sf.services;

  const cityLabel = sf.selectedCity === ALL_CITIES_LABEL || !sf.selectedCity ? t.allRegions : sf.selectedCity;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of services) map[s.category] = (map[s.category] || 0) + 1;
    return map;
  }, [services]);

  const submitSearch = () => sf.goCatalog({ query: query.trim(), category: 'all' });

  /* «ترند هالأسبوع»: ranked by the API from this week's bookings and views, padded from the catalog. */
  const shelf = useMemo(() => trendingShelf(sf.trending, services, TRENDING_SHELF_SIZE), [sf.trending, services]);

  const stats = [
    { v: formatCount(services.length), l: t.statListings },
    { v: formatCount(CATEGORIES.length - 1), l: t.statCategories },
    { v: formatCount(SAUDI_REGIONS.length), l: t.statRegions },
  ];

  const steps = [
    { n: '01', title: t.step1T, body: t.step1B, Icon: Search },
    { n: '02', title: t.step2T, body: t.step2B, Icon: Zap },
    { n: '03', title: t.step3T, body: t.step3B, Icon: Headset },
  ];

  return (
    <main>
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden bg-navy text-white">
        <Blobs
          blobs={[
            { color: '#155EEF', left: '8%', top: '-10%', size: 460, delay: 0 },
            { color: '#5B8DEF', left: '60%', top: '55%', size: 340, delay: -7 },
            { color: '#163A78', left: '78%', top: '-5%', size: 300, delay: -14 },
          ]}
        />
        <div className="relative sf-wrap pt-[clamp(44px,7vw,96px)] pb-[clamp(48px,7vw,88px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-[clamp(32px,5vw,64px)] items-center">
          <div>
            <div className="flex items-center gap-2.5 text-sky-200 text-[13px] font-semibold tracking-[.04em]">
              <span className="w-7 h-0.5 bg-action" aria-hidden />
              {t.heroKicker}
            </div>
            <h1 className="mt-[22px] mb-[18px] text-[clamp(38px,6.4vw,76px)] leading-[1.08] font-bold tracking-[-0.03em] sf-balance">
              {t.heroTitle}
              <br />
              <span className="text-sky">{t.heroHighlight}</span>
            </h1>
            <p className="mb-[30px] max-w-[520px] text-[clamp(16px,1.6vw,19px)] leading-[1.7] text-on-navy-soft sf-pretty">{t.heroSub}</p>

            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="flex items-center gap-1 p-[5px] rounded-[14px] bg-surface max-w-[640px] shadow-e4"
            >
              <button
                type="button"
                onClick={sf.openRegionPicker}
                className="hidden md:flex items-center gap-1.5 px-3.5 h-12 text-navy text-sm font-medium border-e border-line whitespace-nowrap min-h-0 max-w-[180px]"
              >
                <MapPin className="w-4 h-4 text-action shrink-0" aria-hidden />
                <span className="truncate">{cityLabel}</span>
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPh}
                list="sf-hero-suggest"
                aria-label={t.searchBtn}
                className="flex-1 min-w-0 h-12 border-0 outline-none bg-transparent text-[15px] text-navy px-2.5 placeholder:text-muted"
              />
              <datalist id="sf-hero-suggest">
                {CATALOG_SEARCH_CHIPS.map((chip) => (
                  <option key={chip} value={chip} />
                ))}
              </datalist>
              <button
                type="submit"
                className="flex items-center gap-2 h-12 px-[22px] rounded-control bg-action text-white text-[15px] font-semibold min-h-0 transition-all hover:bg-action-hover hover:scale-[1.03]"
              >
                <Search className="w-[18px] h-[18px]" aria-hidden />
                <span>{t.searchBtn}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-[18px]">
              <span className="text-[13px] text-ink-3">{t.quick}</span>
              {CATALOG_SEARCH_CHIPS.slice(0, 5).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sf.goCatalog({ query: chip, category: 'all' })}
                  className="h-8 px-3.5 rounded-lg border border-white/[.18] bg-white/[.06] text-on-navy text-[13px] min-h-0 transition-all hover:bg-white hover:text-navy hover:-translate-y-0.5"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-[clamp(20px,4vw,44px)] mt-11 pt-7 border-t border-white/[.12]">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="text-[30px] font-bold tracking-[-0.02em] leading-none tnum">{s.v}</div>
                  <div className="text-[13px] text-on-navy-muted mt-1.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[clamp(380px,46vw,540px)] max-w-[580px] mx-auto w-full">
            <div
              className="absolute start-[4%] top-[6%] w-[58%] aspect-[4/5] rounded-[20px] overflow-hidden bg-navy-700 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]"
              style={{ ['--r' as string]: '-4deg', animation: 'lm-float 7s ease-in-out infinite' }}
            >
              <img src="/design/hero-1.webp" alt="" className="w-full h-full object-cover block" />
              <div className="absolute start-3.5 bottom-3.5 px-3.5 py-2 rounded-lg bg-navy text-white text-[13px] font-semibold">{t.tag1}</div>
            </div>
            <div
              className="absolute end-[2%] top-0 w-[42%] aspect-square rounded-[18px] overflow-hidden bg-action shadow-[0_24px_50px_-18px_rgba(0,0,0,.6)]"
              style={{ ['--r' as string]: '5deg', animation: 'lm-float 8s ease-in-out infinite', animationDelay: '-2s' }}
            >
              <img src="/design/hero-2.webp" alt="" className="w-full h-full object-cover block" />
              <div className="absolute start-3 bottom-3 px-3 py-1.5 rounded-lg bg-surface text-navy text-xs font-semibold">{t.tag2}</div>
            </div>
            <div
              className="absolute end-[6%] bottom-[4%] w-[40%] aspect-[5/4] rounded-card overflow-hidden bg-tint-blue shadow-[0_24px_50px_-18px_rgba(0,0,0,.6)]"
              style={{ ['--r' as string]: '-2deg', animation: 'lm-float 6s ease-in-out infinite', animationDelay: '-4s' }}
            >
              <img src="/design/hero-3.webp" alt="" className="w-full h-full object-cover block" />
              <div className="absolute start-3 bottom-3 px-3 py-1.5 rounded-lg bg-surface text-navy text-xs font-semibold">{t.tag3}</div>
            </div>
            <div
              className="absolute start-0 bottom-[14%] w-[92px] h-[92px] rounded-full bg-action text-white grid place-items-center text-center z-[2] shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)]"
              style={{ animation: 'lm-wiggle 5s ease-in-out infinite' }}
            >
              <div>
                <div className="flex items-center justify-center gap-[3px] text-xl font-bold leading-none">
                  <ShieldCheck className="w-4 h-4" aria-hidden />
                  {t.vatBadgeTop}
                </div>
                <div className="text-[10px] font-semibold mt-[3px] opacity-85">{t.vatBadgeBottom}</div>
              </div>
            </div>
            <div
              className="absolute end-[36%] top-[44%] px-4 py-2.5 rounded-control bg-surface text-navy text-[13px] font-semibold flex items-center gap-2 z-[2] shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)]"
              style={{ ['--r' as string]: '3deg', animation: 'lm-float 5s ease-in-out infinite', animationDelay: '-1s' }}
            >
              <Zap className="w-4 h-4 text-action" aria-hidden />
              {t.tagInstant}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Categories ───────────── */}
      <section className="sf-wrap pt-[clamp(48px,7vw,88px)]">
        <Reveal className="mb-[26px]">
          <SectionHead
            n="01"
            kicker={t.secCatsKicker}
            title={t.secCats}
            action={<ArrowLink onClick={() => sf.goCatalog()}>{t.viewAll}</ArrowLink>}
          />
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-px bg-surface border border-line rounded-card overflow-hidden">
          {CATEGORIES.filter((c) => c.id !== 'all').map((c, i) => (
            <Reveal
              key={c.id}
              as="div"
              delay={(i % 6) * 70}
              className="bg-surface shadow-[0_0_0_1px_#E3E8F2]"
            >
              <a
                href="/catalog"
                onClick={(e) => {
                  e.preventDefault();
                  sf.goCatalog({ category: c.id, query: '' });
                }}
                className="block no-underline text-navy p-[18px] h-full cursor-pointer transition-colors hover:bg-tint-blue"
              >
                <div className="w-16 h-16 rounded-xl grid place-items-center text-navy" style={{ background: categoryTint(i) }}>
                  <CategoryIcon icon={c.icon} className="w-7 h-7" />
                </div>
                <div className="mt-9 text-base font-semibold">{categoryName(c.id, c.name)}</div>
                <div className="text-xs text-ink-3 mt-[3px] tnum">
                  {formatCount(counts[c.id] || 0)} {t.listingsWord}
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── Occasions ───────────── */}
      <section className="sf-wrap pt-[clamp(48px,7vw,88px)]">
        <Reveal className="mb-[26px]">
          <SectionHead n="02" kicker={t.secOccKicker} title={t.secOcc} />
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
          {OCCASION_PACKAGES.map((o, i) => {
            const Icon = OCCASION_ICONS[o.id] || Heart;
            const en = OCCASION_EN[o.id];
            return (
              <Reveal key={o.id} delay={(i % 6) * 70}>
                <a
                  href="/catalog"
                  onClick={(e) => {
                    e.preventDefault();
                    sf.goCatalog({ category: o.category, audience: o.audience, query: o.title });
                  }}
                  className="flex flex-col justify-between gap-7 min-h-[150px] p-[18px] rounded-card text-navy no-underline cursor-pointer transition-transform hover:-translate-y-1 h-full"
                  style={{ background: OCCASION_TINTS[o.id] || '#DBE7FF' }}
                >
                  <span className="w-11 h-11 rounded-xl bg-navy text-white grid place-items-center">
                    <Icon className="w-[22px] h-[22px]" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold">{ar ? o.title : en?.name || o.title}</span>
                    <span className="block text-xs text-ink-1 mt-[3px] leading-snug">{ar ? o.blurb : en?.sub || o.blurb}</span>
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────── Trending / fresh listings ───────────── */}
      {shelf.length >= TRENDING_SHELF_MIN ? <TrendingSection items={shelf} /> : null}

      {/* ───────────── Why ───────────── */}
      <section className="sf-wrap pt-[clamp(40px,6vw,72px)]">
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[clamp(24px,4vw,56px)] items-start">
          <div className="md:sticky md:top-[88px]">
            <SectionHead n="04" kicker={t.secHowKicker} title={t.secHow} sub={t.secHowSub} />
          </div>
          <div className="flex flex-col">
            {steps.map((s) => (
              <div key={s.n} className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 py-[26px] border-t border-navy-300">
                <div className="text-[clamp(34px,4vw,52px)] font-bold tracking-[-0.04em] text-action leading-none min-w-14 tnum">{s.n}</div>
                <div>
                  <div className="flex items-center gap-2.5 text-[19px] font-bold">
                    <s.Icon className="w-5 h-5 text-navy" aria-hidden />
                    {s.title}
                  </div>
                  <div className="text-[15px] text-ink-1 leading-[1.7] mt-2">{s.body}</div>
                </div>
              </div>
            ))}
            <div className="border-t border-navy-300" />
          </div>
        </Reveal>
      </section>

      {/* ───────────── Request CTA ───────────── */}
      <section className="sf-wrap pt-[clamp(40px,6vw,72px)]">
        <Reveal className="relative overflow-hidden bg-action text-white rounded-panel p-[clamp(32px,5vw,64px)] flex flex-wrap items-center justify-between gap-6">
          <div aria-hidden className="absolute -end-20 -top-20 w-80 h-80 rounded-full border-[60px] border-white/[.08]" />
          <div className="relative max-w-[560px]">
            <div className="text-[13px] font-semibold tracking-[.04em] text-sky-100">{t.ctaBadge}</div>
            <h2 className="mt-3 mb-2.5 text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.03em] leading-[1.1]">{t.ctaTitle}</h2>
            <p className="text-base leading-[1.7] text-on-navy">{t.ctaSub}</p>
          </div>
          <button
            type="button"
            onClick={() => sf.navigate('/request')}
            className="relative flex items-center gap-2.5 h-14 px-7 rounded-xl bg-navy text-white text-base font-bold transition-all hover:-translate-y-[3px] hover:bg-surface hover:text-navy"
          >
            {t.ctaBtn}
            <ArrowIcon className="w-[18px] h-[18px]" />
          </button>
        </Reveal>
      </section>

      {/* ───────────── Reviews (only with real testimonials) ───────────── */}
      {TESTIMONIALS.length ? <ReviewsSection /> : null}

      {/* ───────────── Partner logos (only when configured) ───────────── */}
      {PARTNER_LOGOS.length ? (
        <section className="sf-wrap pt-[clamp(40px,6vw,64px)]">
          <Reveal className="text-center text-[13px] font-semibold text-ink-3 tracking-[.04em] mb-6">{t.secTrust}</Reveal>
          <Marquee duration={30} gap={56}>
            {PARTNER_LOGOS.map((logo) => (
              <div key={logo.src} className="h-14 w-[150px] grid place-items-center opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                <img src={logo.src} alt={logo.name} className="max-h-[52px] max-w-[140px] object-contain" />
              </div>
            ))}
          </Marquee>
        </section>
      ) : null}

      {/* ───────────── App ───────────── */}
      <AppSection />
    </main>
  );
}

/** The one line that explains a rank: bookings first, then views, then «جديد». Null when nothing moved. */
function trendLine(item: TrendingShelfItem, t: ReturnType<typeof useLang>['t'], ar: boolean): string | null {
  const s = item.trending;
  if (!s) return null;
  if (s.bookings > 0) return countPhrase(s.bookings, t.trendBookings, ar);
  if (s.views > 0) return countPhrase(s.views, t.trendViews, ar);
  if (s.isNew) return t.trendNew;
  return null;
}

function TrendingSection({ items }: { items: TrendingShelfItem[] }) {
  const { t, ar, L } = useLang();
  const sf = useStorefront();
  const podiumOrder = [items[1], items[0], items[2]].filter(Boolean);
  const rest = items.slice(3, 8);
  const topScore = Math.max(0, ...items.map((p) => p.trending?.score || 0));
  /** Relative heat for the #4+ rows; a decorative taper when nothing has moved yet. */
  const heat = (p: TrendingShelfItem, i: number) =>
    topScore > 0 ? Math.max(8, Math.round(((p.trending?.score || 0) / topScore) * 100)) : 82 - i * 13;

  const tickerItems = items.slice(0, 6).map((p) => {
    const lead = (p.trending?.bookings || 0) > 0 ? t.tickerBooked : t.availableNow;
    return `${lead} · ${p.title} · ${p.cities?.[0] || L('السعودية', 'Saudi Arabia')}`;
  });

  return (
    <section className="sf-wrap pt-[clamp(48px,7vw,88px)]">
      <Reveal className="relative overflow-hidden bg-navy text-white rounded-[24px] pt-[clamp(24px,4vw,48px)] px-[clamp(18px,3vw,40px)] pb-[clamp(24px,3vw,40px)]">
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ left: '-10%', top: '-30%', width: 420, height: 420, background: '#155EEF', opacity: 0.35, filter: 'blur(80px)', animation: 'lm-blob 16s ease-in-out infinite' }} />
          <div className="absolute rounded-full" style={{ left: '70%', top: '60%', width: 360, height: 360, background: '#5B8DEF', opacity: 0.35, filter: 'blur(80px)', animation: 'lm-blob 16s ease-in-out infinite', animationDelay: '-6s' }} />
        </div>
        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-sky-200 tracking-[.04em]">
              <span className="tnum">03</span>
              <span className="w-6 h-0.5 bg-sky" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky" style={{ animation: 'lm-pulse 1.8s ease-out infinite' }} aria-hidden />
                {t.secTrendKicker}
              </span>
            </div>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-bold tracking-[-0.03em]">{t.secTrend}</h2>
          </div>
          <Marquee
            duration={26}
            gap={28}
            className="max-w-[min(100%,420px)] border border-white/[.12] rounded-control py-2 bg-white/[.04]"
          >
            {tickerItems.map((k, i) => (
              <span key={i} dir={ar ? 'rtl' : 'ltr'} className="flex items-center gap-2 text-xs text-on-navy-soft whitespace-nowrap">
                <Zap className="w-[13px] h-[13px] text-sky" aria-hidden />
                {k}
              </span>
            ))}
          </Marquee>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] gap-3.5 items-end mt-[clamp(24px,3vw,40px)]">
          {podiumOrder.map((p, i) => {
            const rank = items.indexOf(p) + 1;
            const top = i === 1;
            const line = trendLine(p, t, ar);
            return (
              <a
                key={p.id}
                href={`/service/${encodeURIComponent(p.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  sf.goProduct(p.id);
                }}
                className={cn(
                  'relative flex flex-col justify-end rounded-[20px] overflow-hidden no-underline text-white bg-navy-700 shadow-[0_30px_60px_-28px_rgba(0,0,0,.7)] transition-all hover:-translate-y-2.5 hover:scale-[1.02] hover:[animation-play-state:paused] min-h-[300px]',
                  top ? 'md:min-h-[400px]' : 'md:min-h-[330px]',
                )}
                style={{
                  order: rank,
                  ['--r' as string]: top ? '0deg' : i === 0 ? '-1.5deg' : '1.5deg',
                  animation: `lm-float ${top ? '7s' : '8s'} ease-in-out infinite`,
                  animationDelay: `${-i * 2.3}s`,
                }}
              >
                {productPhoto(p) ? <img src={productPhoto(p)} alt="" className="absolute inset-0 w-full h-full object-cover block" /> : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,26,51,.05)_30%,rgba(10,26,51,.95)_100%)]" />
                <div
                  className={cn(
                    'absolute top-3.5 start-3.5 grid place-items-center rounded-[14px] font-bold tracking-[-0.04em] shadow-[0_10px_24px_-8px_rgba(0,0,0,.5)] tnum',
                    top ? 'w-[52px] h-[52px] text-2xl bg-action text-white' : 'w-[42px] h-[42px] text-lg bg-white/[.92] text-navy',
                  )}
                >
                  {rank}
                </div>
                {top && line ? (
                  <div className="absolute top-3.5 end-3.5 flex items-center gap-1.5 h-[30px] px-2.5 rounded-lg bg-surface text-navy text-xs font-bold tnum">
                    <TrendingUp className="w-3.5 h-3.5 text-action" aria-hidden />
                    {line}
                  </div>
                ) : null}
                <div className="relative p-[clamp(16px,2vw,24px)]">
                  <div className="text-xs text-on-navy-soft">{p.provider?.name}</div>
                  <div className={cn('font-bold tracking-[-0.02em] leading-[1.2] mt-1 sf-balance', top ? 'text-[clamp(20px,2vw,26px)]' : 'text-[17px]')}>{p.title}</div>
                  <div className="flex items-center justify-between gap-2.5 mt-3">
                    <span className="text-xl font-bold tnum">{money(p.price, ar)}</span>
                    <Rating service={p} tone="dark" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {rest.length ? (
          <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5 mt-3.5">
            {rest.map((p, i) => (
              <a
                key={p.id}
                href={`/service/${encodeURIComponent(p.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  sf.goProduct(p.id);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-white/[.06] border border-white/10 no-underline text-white transition-all hover:bg-white/[.14] hover:-translate-y-[3px]"
              >
                <span className="text-lg font-bold text-sky min-w-[26px] tracking-[-0.03em] tnum">#{i + 4}</span>
                <span className="w-11 h-11 rounded-control overflow-hidden bg-navy-700 shrink-0">
                  {productPhoto(p) ? <img src={productPhoto(p)} alt="" className="w-full h-full object-cover block" /> : null}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate">{p.title}</span>
                  <span className="block mt-1.5 h-[3px] rounded-sm bg-white/[.12] overflow-hidden" title={trendLine(p, t, ar) || undefined}>
                    <span
                      className="block h-full bg-[linear-gradient(90deg,#155EEF,#5B8DEF)]"
                      style={{ width: `${heat(p, i)}%`, transformOrigin: ar ? 'right' : 'left', animation: 'lm-grow 1.4s cubic-bezier(.2,.8,.2,1) both', animationDelay: `${i * 0.12}s` }}
                    />
                  </span>
                </span>
                <span className="text-sm font-bold whitespace-nowrap tnum">{money(p.price, ar)}</span>
              </a>
            ))}
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}

function ReviewsSection() {
  const { t, ar, flip, flipInv } = useLang();
  const [current, setCurrent] = useState(0);
  const reviews = TESTIMONIALS;
  const n = reviews.length;
  const avg = n ? reviews.reduce((a, r) => a + r.rating, 0) / n : 0;
  const bars = [5, 4, 3].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    return { n: stars, pct: n ? Math.round((count / n) * 100) : 0 };
  });

  return (
    <section className="sf-wrap pt-[clamp(56px,8vw,96px)]">
      <Reveal className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[clamp(24px,4vw,56px)] items-center">
        <div>
          <SectionHead n="05" kicker={t.secRevKicker} title={t.secRev} />
          <div className="flex items-center gap-3.5 flex-wrap mt-[18px]">
            <div className="flex items-baseline gap-1">
              <span className="text-[clamp(48px,6vw,72px)] font-bold tracking-[-0.04em] leading-none tnum">{avg.toFixed(1)}</span>
              <span className="text-lg text-ink-3">/5</span>
            </div>
            <div>
              <div className="flex gap-0.5 text-action">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-[18px] h-[18px] fill-current" aria-hidden />
                ))}
              </div>
              <div className="text-[13px] text-ink-3 mt-1 tnum">
                {n} {t.revCountWord}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6 max-w-[360px]">
            {bars.map((b, i) => (
              <div key={b.n} className="grid grid-cols-[20px_minmax(0,1fr)_36px] items-center gap-2.5 text-xs text-ink-1">
                <span className="font-bold tnum">{b.n}</span>
                <span className="h-2 rounded bg-line overflow-hidden">
                  <span
                    className="block h-full rounded bg-[linear-gradient(90deg,#155EEF,#5B8DEF)]"
                    style={{ width: `${b.pct}%`, transformOrigin: ar ? 'right' : 'left', animation: 'lm-grow 1.2s cubic-bezier(.2,.8,.2,1) both', animationDelay: `${i * 0.15}s` }}
                  />
                </span>
                <span className="text-end text-ink-3 tnum">{b.pct}%</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-[26px]">
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + n) % n)}
              className="w-11 h-11 rounded-xl border border-navy-300 bg-surface text-navy grid place-items-center transition-all hover:bg-navy hover:text-white hover:border-navy"
              style={{ transform: flip }}
              aria-label={t.back}
            >
              <ChevronForward className="w-[18px] h-[18px] rtl:scale-x-100" />
            </button>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % n)}
              className="w-11 h-11 rounded-xl border border-navy-300 bg-surface text-navy grid place-items-center transition-all hover:bg-navy hover:text-white hover:border-navy"
              style={{ transform: flipInv }}
              aria-label={t.next}
            >
              <ChevronForward className="w-[18px] h-[18px] rtl:scale-x-100" />
            </button>
            <div className="flex items-center gap-1.5 ms-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className="h-2 rounded border-0 p-0 min-h-0 transition-all"
                  style={{ width: i === current ? 28 : 8, background: i === current ? '#155EEF' : '#C9D3E6' }}
                  aria-label={`${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="relative min-h-[380px]">
          {reviews.map((r, i) => {
            const off = (i - current + n) % n;
            const dir = ar ? -1 : 1;
            const front = off === 0;
            const mid = off === 1;
            const back = off === 2;
            const visible = front || mid || back;
            return (
              <div
                key={r.id}
                onClick={front ? undefined : () => setCurrent(i)}
                className={cn(
                  'absolute inset-0 flex flex-col justify-between p-[clamp(22px,3vw,34px)] rounded-[24px] border transition-all duration-[600ms] cursor-pointer',
                  front ? 'bg-navy text-white border-navy' : mid ? 'bg-tint-blue text-navy border-line' : 'bg-surface text-navy border-line',
                )}
                style={{
                  zIndex: front ? 3 : mid ? 2 : back ? 1 : 0,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? 'auto' : 'none',
                  transform: front
                    ? 'none'
                    : mid
                      ? `translate(${dir * 22}px, 22px) scale(.95) rotate(${dir * 2}deg)`
                      : back
                        ? `translate(${dir * 44}px, 44px) scale(.9) rotate(${dir * 4}deg)`
                        : 'translate(0, 80px) scale(.85)',
                  boxShadow: front ? '0 40px 80px -30px rgba(10,26,51,.55)' : '0 20px 40px -24px rgba(10,26,51,.25)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-[64px] leading-[.6] font-bold font-serif', front ? 'text-sky' : 'text-action')}>“</span>
                  <span className={cn('flex gap-0.5 text-[15px]', front ? 'text-sky' : 'text-action')}>
                    {Array.from({ length: Math.round(r.rating) }).map((_, s) => (
                      <Star key={s} className="w-[15px] h-[15px] fill-current" aria-hidden />
                    ))}
                  </span>
                </div>
                <p className="my-[18px] text-[clamp(17px,1.7vw,22px)] leading-[1.65] font-medium sf-pretty">{r.comment}</p>
                <div className="flex items-center gap-3">
                  <InitialAvatar name={r.name} className={cn('w-11 h-11 text-[15px]', front ? 'bg-action' : 'bg-navy')} />
                  <span>
                    <span className="block text-[15px] font-bold">{r.name}</span>
                    <span className="block text-xs opacity-70 mt-0.5">
                      {r.event} · {r.city}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

function AppSection() {
  const { t } = useLang();
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  React.useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (standalone) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const hasStores = Boolean(APP_STORE_URL || PLAY_STORE_URL);
  if (!hasStores && !prompt) return null;

  return (
    <section className="sf-wrap pt-[clamp(48px,7vw,88px)]">
      <Reveal className="bg-surface border border-line rounded-panel overflow-hidden grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-6">
        <div className="p-[clamp(32px,5vw,64px)]">
          <h2 className="mb-3 text-[clamp(28px,3.6vw,42px)] font-bold tracking-[-0.03em] leading-[1.1]">{t.appTitle}</h2>
          <p className="mb-7 text-base leading-[1.7] text-ink-1 max-w-[440px]">{t.appSub}</p>
          <div className="flex flex-wrap gap-3">
            {APP_STORE_URL ? (
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 h-[52px] px-5 rounded-xl bg-navy text-white no-underline font-semibold text-[15px] transition-transform hover:-translate-y-[3px]">
                <Download className="w-5 h-5" aria-hidden />
                App Store
              </a>
            ) : null}
            {PLAY_STORE_URL ? (
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 h-[52px] px-5 rounded-xl border border-navy-300 text-navy no-underline font-semibold text-[15px] transition-all hover:-translate-y-[3px] hover:border-navy">
                <Download className="w-5 h-5" aria-hidden />
                Google Play
              </a>
            ) : null}
            {prompt && !installed ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    prompt.prompt();
                    const { outcome } = await prompt.userChoice;
                    if (outcome === 'accepted') setInstalled(true);
                  } finally {
                    setPrompt(null);
                  }
                }}
                className="flex items-center gap-2.5 h-[52px] px-5 rounded-xl bg-action text-white font-semibold text-[15px] transition-transform hover:-translate-y-[3px]"
              >
                <Download className="w-5 h-5" aria-hidden />
                {t.appInstall}
              </button>
            ) : null}
          </div>
        </div>
        <div className="self-end justify-self-center w-[min(260px,70%)] h-[300px] mt-4 rounded-t-[36px] border-[6px] border-b-0 border-navy grid place-items-center text-xs text-ink-1 text-center p-5 bg-[repeating-linear-gradient(135deg,#DBE7FF_0_12px,#EAF0FF_12px_24px)]">
          <img src="/design/hero-4.webp" alt="" className="w-full h-full object-cover rounded-t-[30px]" />
        </div>
      </Reveal>
    </section>
  );
}
