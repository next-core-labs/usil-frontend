import React, { useState } from 'react';
import { MapPin, ArrowUpRight, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CATEGORIES } from '../data/services';
import { SAUDI_REGIONS } from '../data/saudiPlaces';
import {
  OCCASION_PACKAGES,
  SAUDI_SEASON,
  WHY_USIL,
  AudienceFilter,
  FULFILLMENT_LANES,
  FulfillmentFilter,
} from '../data/saudiMarket';
import { UsilLockup } from './UsilLockup';
import { BrandedImage } from './BrandedImage';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onSelectCity?: (city: string) => void;
  onPickPackage?: (category: string, audience: AudienceFilter, query: string) => void;
  onPickSeason?: (query: string) => void;
  onSelectFulfillment?: (lane: FulfillmentFilter) => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onRefund?: () => void;
  onSupport?: () => void;
  onAbout?: () => void;
}

const FooterAccordion: React.FC<{
  title: string;
  id: string;
  openId: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ title, id, openId, onToggle, children }) => {
  const open = openId === id;
  return (
    <div className="border-b border-white/10 md:border-0 pb-3 md:pb-0">
      <button
        type="button"
        className="w-full flex items-center justify-between min-h-11 md:min-h-0 py-2 md:py-0 md:pointer-events-none md:cursor-default"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <h4 className="kicker">{title}</h4>
        <ChevronDown className={`w-4 h-4 text-sand md:hidden transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${open ? 'block' : 'hidden'} md:block mt-3`}>{children}</div>
    </div>
  );
};

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectCity,
  onPickPackage,
  onPickSeason,
  onSelectFulfillment,
  onPrivacy,
  onTerms,
  onRefund,
  onSupport,
  onAbout,
}) => {
  const [openId, setOpenId] = useState<string | null>('brand');
  const linkClass = 'hover:text-sky transition-colors text-white/70 font-medium text-right';

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <footer className="pattern-navy text-white/70 text-right pt-10 md:pt-16 pb-28 md:pb-8">
      <div className="container mx-auto px-4 lg:px-8 pb-10 mb-10 border-b border-white/10 space-y-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-2xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-action" />
              سوق مدار لتوريد المناسبات · السعودية
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              كل مورّد تحتاجه للمناسبة في مكان واحد
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
              يوصل يجمع حجوزات المورّدين ويضمن التنفيذ — السعر المعروض نهائي ويشمل الضريبة ١٥٪. وسيط خالص: لا ننظّم المناسبات، نمكّن من ينظّمها. أربعة مسارات توريد داخل المدينة، بدون وعد بساعي ١٥ دقيقة ولا تتبع وهمي.
            </p>
            <ul className="grid sm:grid-cols-2 gap-1.5 text-2xs text-white/75">
              {WHY_USIL.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-white/15 bg-white/5">
              <div className="aspect-[16/9] relative bg-navy">
                <BrandedImage
                  alt="قاعة مجهزة قبل وصول الضيوف"
                  category="halls"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <p className="text-2xs text-sand font-semibold">مورّد موثّق · الأكثر طلباً</p>
                  <p className="text-sm font-bold">قاعة مجهزة — إضاءة ومسرح في مكانهما</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">1,850 ر.س / للمناسبة</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('halls');
                    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-action text-white font-bold"
                >
                  معاينة الباقة
                </button>
              </div>
            </div>
            <p className="mt-2 text-2xs text-white/55 flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky shrink-0 mt-0.5" />
              حماية وساطة: جاهزية المورّد قبل الموعد — ليس تتبع GPS مختلق.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="مبادئ السوق">
          {[
            { value: '١٥٪', label: 'الضريبة مشمولة في السعر النهائي' },
            { value: '100%', label: 'ضمان دفع بعد التنفيذ' },
            { value: String(CATEGORIES.filter((c) => c.id !== 'all').length), label: 'فئات توريد للمناسبة' },
            { value: 'وسيط', label: 'لا ننظّم المناسبة — نمكّن من ينظّمها' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="font-bold text-lg text-white font-mono">{stat.value}</div>
              <div className="text-2xs text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {OCCASION_PACKAGES.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => {
                onPickPackage?.(pack.category, pack.audience, pack.title);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-right rounded-xl border border-white/10 bg-white/5 p-3 hover:border-sky"
            >
              <p className="text-sm font-bold text-white">{pack.title}</p>
              <p className="text-2xs text-white/60 mt-1 leading-snug">{pack.blurb}</p>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {FULFILLMENT_LANES.map((lane) => (
            <button
              key={lane.id}
              type="button"
              onClick={() => {
                onSelectFulfillment?.(lane.id);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-right rounded-xl border border-white/10 bg-white/5 p-3 hover:border-sky"
            >
              <p className="text-sm font-bold text-sky">{lane.chip}</p>
              <p className="text-2xs text-white/65 mt-1 leading-snug">{lane.meaning}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 pb-12 border-b border-white/10">
        <div className="lg:col-span-3 space-y-4">
          <UsilLockup variant="inverse" />
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm font-normal">
            يوصل يجمع كل مورّد تحتاجه لمناسبتك في مكان واحد — ونضمن أن كل شيء يصل. وسيط خالص: لا ننظّم المناسبات، نمكّن من ينظّمها.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
            <span className="inline-flex items-center gap-1 font-medium text-white/60">
              <MapPin className="w-3.5 h-3.5 text-sky" />
              <span>المملكة العربية السعودية</span>
            </span>
            <span className="inline-flex items-center gap-1 text-navy font-bold bg-white px-2 py-0.5 rounded-full">
              سعر نهائي · ضريبة 15%
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <FooterAccordion title="الأقسام" id="cats" openId={openId} onToggle={toggle}>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <li key={cat.id}>
                  <button type="button" onClick={() => onSelectCategory(cat.id)} className={linkClass}>
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        <div className="lg:col-span-2">
          <FooterAccordion title="باقات" id="packs" openId={openId} onToggle={toggle}>
            <ul className="space-y-2 text-xs">
              {OCCASION_PACKAGES.map((pack) => (
                <li key={pack.id}>
                  <button
                    type="button"
                    onClick={() => onPickPackage?.(pack.category, pack.audience, pack.title)}
                    className={linkClass}
                  >
                    {pack.title}
                  </button>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        <div className="lg:col-span-2">
          <FooterAccordion title="المواسم" id="seasons" openId={openId} onToggle={toggle}>
            <ul className="space-y-2 text-xs">
              {SAUDI_SEASON.map((row) => (
                <li key={row.month}>
                  <button type="button" onClick={() => onPickSeason?.(row.query)} className={linkClass}>
                    {row.month}
                  </button>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        <div className="lg:col-span-3">
          <FooterAccordion title="ليش يوصل" id="why" openId={openId} onToggle={toggle}>
            <ul className="space-y-2 text-xs text-white/75">
              {WHY_USIL.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-sand shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        <div className="lg:col-span-3 lg:col-start-1">
          <FooterAccordion title="الدعم والقانوني" id="legal" openId={openId} onToggle={toggle}>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/about"
                  className={linkClass}
                  onClick={(e) => {
                    if (onAbout) {
                      e.preventDefault();
                      onAbout();
                    }
                  }}
                >
                  عن يوصل
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className={linkClass}
                  onClick={(e) => {
                    if (onSupport) {
                      e.preventDefault();
                      onSupport();
                    }
                  }}
                >
                  الدعم والتواصل
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className={`${linkClass} inline-flex items-center gap-1`}
                  onClick={(e) => {
                    if (onSupport) {
                      e.preventDefault();
                      onSupport();
                    }
                  }}
                >
                  راسل الإدارة
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a href="mailto:hello@usil.app" className={linkClass}>
                  hello@usil.app
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className={linkClass}
                  onClick={(e) => {
                    if (onPrivacy) {
                      e.preventDefault();
                      onPrivacy();
                    }
                  }}
                >
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className={linkClass}
                  onClick={(e) => {
                    if (onTerms) {
                      e.preventDefault();
                      onTerms();
                    }
                  }}
                >
                  شروط الاستخدام
                </a>
              </li>
              <li>
                <a
                  href="/refund"
                  className={linkClass}
                  onClick={(e) => {
                    if (onRefund) {
                      e.preventDefault();
                      onRefund();
                    }
                  }}
                >
                  سياسة الاسترجاع
                </a>
              </li>
            </ul>
          </FooterAccordion>
        </div>

        <div className="lg:col-span-3">
          <FooterAccordion title="المناطق" id="cities" openId={openId} onToggle={toggle}>
            <div className="flex flex-wrap gap-1.5">
              {SAUDI_REGIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSelectCity?.(c)}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-white/80 font-medium hover:bg-white/10 hover:text-white"
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-2 text-2xs text-white/50 leading-relaxed">
              البحث يشمل كل المحافظات والقرى والمراكز داخل المناطق الثلاث عشرة.
            </p>
          </FooterAccordion>
        </div>

        {onSelectFulfillment ? (
          <div className="lg:col-span-3">
            <FooterAccordion title="المسارات" id="lanes" openId={openId} onToggle={toggle}>
              <ul className="space-y-2 text-xs">
                {FULFILLMENT_LANES.map((lane) => (
                  <li key={lane.id}>
                    <button type="button" onClick={() => onSelectFulfillment(lane.id)} className={linkClass}>
                      {lane.chip}
                    </button>
                  </li>
                ))}
              </ul>
            </FooterAccordion>
          </div>
        ) : null}
      </div>

      <div className="container mx-auto px-4 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/45">
        <p className="font-latin">© {new Date().getFullYear()} Usil · يوصل — جميع الحقوق محفوظة</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-medium">
          <a
            href="/about"
            className="inline-flex items-center min-h-11 px-1 hover:text-white transition-colors"
            onClick={(e) => {
              if (onAbout) {
                e.preventDefault();
                onAbout();
              }
            }}
          >
            عن يوصل
          </a>
          <a
            href="/support"
            className="inline-flex items-center min-h-11 px-1 hover:text-white transition-colors"
            onClick={(e) => {
              if (onSupport) {
                e.preventDefault();
                onSupport();
              }
            }}
          >
            الدعم
          </a>
          <a
            href="/privacy"
            className="inline-flex items-center min-h-11 px-1 hover:text-white transition-colors"
            onClick={(e) => {
              if (onPrivacy) {
                e.preventDefault();
                onPrivacy();
              }
            }}
          >
            الخصوصية
          </a>
          <a
            href="/terms"
            className="inline-flex items-center min-h-11 px-1 hover:text-white transition-colors"
            onClick={(e) => {
              if (onTerms) {
                e.preventDefault();
                onTerms();
              }
            }}
          >
            الشروط
          </a>
          <a
            href="/refund"
            className="inline-flex items-center min-h-11 px-1 hover:text-white transition-colors"
            onClick={(e) => {
              if (onRefund) {
                e.preventDefault();
                onRefund();
              }
            }}
          >
            الاسترجاع
          </a>
        </div>
      </div>
    </footer>
  );
};
