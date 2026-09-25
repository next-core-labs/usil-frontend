import React, { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Store } from 'lucide-react';
import { applySeo } from '../../utils/seo';
import { SAUDI_REGIONS } from '../../data/saudiPlaces';
import { WHY_USIL, FULFILLMENT_LANES } from '../../data/saudiMarket';
import { HowUsilWorks } from '../market/HowUsilWorks';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  useEffect(() => {
    applySeo('about');
    return () => applySeo('home');
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl text-right" dir="rtl">
      <button type="button" onClick={onBack} className="text-sm font-bold text-action mb-6">
        ← العودة للمتجر
      </button>
      <p className="text-2xs font-medium text-action mb-2">يوصل · Usil</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-3">عن يوصل</h1>
      <p className="text-sm text-ink-1 leading-relaxed mb-6">
        يوصل سوق إلكتروني لتوريد المناسبات في السعودية — مثل متجر تطلب منه الضيافة والقاعات والتصوير والديكور،
        بسعر نهائي يشمل الضريبة ١٥٪. نحن وسيط توريد: نجمع المورّدين الموثّقين ونتابع التنفيذ حتى يصل. لا ننظّم الحفل
        نيابة عنك.
      </p>

      <div className="mb-8">
        <HowUsilWorks />
      </div>

      <ul className="space-y-2 text-sm text-ink-1 mb-8">
        {WHY_USIL.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-base font-bold text-navy mb-3">مسارات التوريد</h2>
      <div className="grid sm:grid-cols-2 gap-2 mb-8">
        {FULFILLMENT_LANES.map((lane) => (
          <div key={lane.id} className="rounded-xl border border-line bg-white p-3">
            <p className="text-sm font-bold text-action">{lane.chip}</p>
            <p className="text-xs text-ink-2 mt-1 leading-relaxed">{lane.meaning}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-bold text-navy mb-2">المدن والمناطق</h2>
      <p className="text-xs text-ink-3 mb-3">
        التوريد حسب جاهزية المورّد في أي منطقة أو محافظة أو قرية داخل المملكة — ابحث بالاسم من شريط المدن.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-8">
        {SAUDI_REGIONS.map((city) => (
          <span key={city} className="px-2.5 py-1 rounded-full bg-paper border border-line text-xs font-medium">
            {city}
          </span>
        ))}
      </div>

      <p className="text-xs text-ink-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-action shrink-0 mt-0.5" />
        <span>
          للدعم: صفحة{' '}
          <a href="/support" className="text-action font-bold">
            الدعم
          </a>{' '}
          أو{' '}
          <a href="mailto:hello@usil.app" className="text-action font-bold" dir="ltr">
            hello@usil.app
          </a>
          .
        </span>
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action text-white text-sm font-bold"
      >
        <Store className="w-4 h-4" />
        تصفّح المتجر
      </button>
    </article>
  );
};
