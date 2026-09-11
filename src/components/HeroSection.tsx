import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Music,
  Mic,
} from 'lucide-react';
import { CATEGORIES } from '../data/services';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import {
  AUDIENCE_OPTIONS,
  OCCASION_PACKAGES,
  AudienceFilter,
  CATALOG_SEARCH_CHIPS,
  CHIP_TO_CATEGORY,
  SEARCH_PLACEHOLDER,
  categoryForSearchQuery,
} from '../data/saudiMarket';

interface HeroSectionProps {
  onSearch: (city: string, category: string, date: string, guests: string) => void;
  onOpenCalculator: () => void;
  onSelectCategory: (categoryId: string) => void;
  onPickOccasion?: (category: string, audience: AudienceFilter) => void;
  selectedAudience?: string;
  onSelectAudience?: (audienceId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onOpenCalculator,
  onSelectCategory,
  onPickOccasion,
  selectedAudience = 'all',
  onSelectAudience,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [city, setCity] = useState('جميع المدن');
  const [category, setCategory] = useState('all');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('50-100 ضيف');
  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery !== undefined ? searchQuery : localQuery;
  const setQuery = (value: string) => {
    if (onSearchQueryChange) onSearchQueryChange(value);
    else setLocalQuery(value);
  };

  const applyTypedSearch = (raw: string) => {
    const next = raw.trim();
    setQuery(next);
    const mapped = categoryForSearchQuery(next) || CHIP_TO_CATEGORY[next] || category;
    setCategory(mapped);
    onSelectCategory(mapped);
    onSearch(city, mapped, date, guests);
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyTypedSearch(query);
  };

  return (
    <section className="relative bg-[#F7F8FA] border-b border-[#E4E7EC] pt-10 pb-16 lg:pt-16 lg:pb-24 text-right overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Main Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Pill Status Badge */}
            <div className="rise inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A1A33] text-white text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
              <span className="font-kicker tracking-wide">سوق مدار لتوريد المناسبات · السعودية</span>
            </div>

            <h1 className="rise font-display text-[2.05rem] sm:text-5xl lg:text-[3rem] font-extrabold text-[#0A1A33] leading-[1.25]">
              كل مورّد تحتاجه المناسبة
              <br />
              في مكان واحد
            </h1>

            <p className="text-[#475467] text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              يوصل يجمع حجوزات المورّدين ويضمن التنفيذ — حتى لا يعتمد شيء على مكالمة هاتفية. السعر المعروض هو السعر النهائي ويشمل الضريبة 15%، وإذا تخلّف مورّد نتحمّل المسؤولية.
            </p>

            {onPickOccasion ? (
              <div className="space-y-2" aria-label="نوع المناسبة">
                <p className="text-[11px] font-bold text-[#667085]">نوع المناسبة</p>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASION_PACKAGES.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        onPickOccasion(pack.category, pack.audience);
                        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#E4E7EC] text-xs font-bold text-[#0A1A33] hover:border-[#155EEF] hover:text-[#155EEF]"
                    >
                      {pack.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {onSelectAudience ? (
              <div className="space-y-2" aria-label="الجمهور">
                <p className="text-[11px] font-bold text-[#667085]">الجمهور</p>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSelectAudience(opt.id);
                        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        selectedAudience === opt.id
                          ? 'bg-[#155EEF] border-[#155EEF] text-white'
                          : 'bg-white border-[#E4E7EC] text-[#0A1A33] hover:border-[#155EEF]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* World-Class Unified Search & Booking Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-3.5 rounded-2xl border border-[#E4E7EC] card-shadow space-y-3 max-w-2xl"
            >
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus-within:border-[#155EEF] focus-within:bg-white transition-colors">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                  <Search className="w-3.5 h-3.5 text-[#155EEF]" />
                  <span>ابحث في التوريد والمورّدين</span>
                </div>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyTypedSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                  placeholder={SEARCH_PLACEHOLDER}
                  list="usil-hero-hospitality-suggest"
                  aria-label="بحث التوريد والمورّدين"
                  className="w-full bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none"
                />
                <datalist id="usil-hero-hospitality-suggest">
                  {CATALOG_SEARCH_CHIPS.map((chip) => (
                    <option key={chip} value={chip} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-wrap gap-1.5 max-w-full" role="list" aria-label="اقتراحات البحث">
                {CATALOG_SEARCH_CHIPS.slice(0, 16).map((chip) => {
                  const active = query.trim() === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const nextCategory = CHIP_TO_CATEGORY[chip] || 'all';
                        setQuery(chip);
                        setCategory(nextCategory);
                        onSelectCategory(nextCategory);
                        const el = document.getElementById('services-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        active
                          ? 'bg-[#0A1A33] border-[#0A1A33] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#155EEF] hover:text-[#155EEF]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                
                {/* 1. City */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>المدينة</span>
                  </div>
                  <PlaceSearchSelect
                    value={city}
                    onChange={setCity}
                    hideIcon
                    aria-label="المدينة"
                  />
                </div>

                {/* 2. Category */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-0.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>فئة الخدمة</span>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="فئة الخدمة"
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Guests Capacity */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-0.5">
                    <Users className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>سعة الحضور</span>
                  </div>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    aria-label="سعة الحضور"
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="20-50 ضيف">20 - 50 ضيف</option>
                    <option value="50-100 ضيف">50 - 100 ضيف</option>
                    <option value="100-250 ضيف">100 - 250 ضيف</option>
                    <option value="250+ ضيف">أكثر من 250 ضيف</option>
                  </select>
                </div>

                {/* 4. Date */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>تاريخ المناسبة</span>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label="تاريخ المناسبة"
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>استعراض ومطابقة المورّدين</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>حاسبة ميزانية الباقات التقديرية</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </form>

            {/* Launch-honest highlights — no invented volume or ratings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <div className="font-extrabold text-lg text-slate-900 font-mono">١٥٪</div>
                <div className="text-[11px] text-slate-500 font-medium">الضريبة مشمولة في السعر النهائي</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <div className="font-extrabold text-lg text-slate-900 font-mono">100%</div>
                <div className="text-[11px] text-slate-500 font-medium">ضمان دفع بعد التنفيذ</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <div className="font-extrabold text-lg text-slate-900 font-mono">{CATEGORIES.filter((c) => c.id !== 'all').length}</div>
                <div className="text-[11px] text-slate-500 font-medium">فئات توريد للمناسبة</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <div className="font-extrabold text-lg text-slate-900">وسيط</div>
                <div className="text-[11px] text-slate-500 font-medium">لا ننظّم المناسبة — نمكّن من ينظّمها</div>
              </div>
            </div>

          </div>

          {/* Editorial Visual Showcase (Clean, high-end photography & verified card) */}
          <div className="hidden md:block lg:col-span-5 space-y-4">
            
            <div className="relative overflow-hidden border border-[#E4E7EC] bg-[#0A1A33] card-shadow rounded-xl p-6 text-white space-y-3">
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold">
                  السوق يعرض منتجات المورّدين فقط
                </span>
                <h3 className="text-lg font-extrabold leading-snug">ما فيه صورة أو سعر وهمي</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  المورّد الجديد يرفع صور منتجاته ويكتب السعر بالريال. البطاقة تظهر في السوق بعد الصورة والسعر، والدفع عبر ميسر على هذا المبلغ.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('all');
                    const el = document.getElementById('services-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white font-bold transition-colors"
                >
                  تصفح السوق
                </button>
            </div>

            {/* Trust Assurance Strip */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#155EEF]/10 text-[#155EEF] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal m-0">
                <strong className="text-slate-900 font-bold">وساطة محمية بالكامل:</strong> يتم التحقق من جاهزية المورّد قبل الموعد بـ 24 ساعة لضمان وصول كافة التجهيزات في وقتها.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
