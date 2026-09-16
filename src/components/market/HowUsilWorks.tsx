import React from 'react';
import { Search, BadgeCheck, Truck } from 'lucide-react';

const STEPS = [
  {
    n: '١',
    title: 'اختر',
    desc: 'المناسبة، المدينة، والجمهور — ثم قارن مورّدين موثّقين بنفس البطاقة.',
    icon: Search,
  },
  {
    n: '٢',
    title: 'احجز بسعر نهائي',
    desc: 'المورّد يثبّت السعر ثم الدفع عبر ميسر (مدى / آبل باي) أو التحصيل معه.',
    icon: BadgeCheck,
  },
  {
    n: '٣',
    title: 'نتابع التوريد',
    desc: 'يوصل وسيط توريد: نتابع جاهزية المورّد والوصول. لا ننظّم الحفل نيابة عنك.',
    icon: Truck,
  },
];

export const HowUsilWorks: React.FC = () => {
  return (
    <section
      id="how-usil-works"
      className="text-right bg-navy text-white rounded-2xl border border-white/10 px-4 sm:px-6 py-5 sm:py-6"
      aria-label="كيف يشتغل يوصل"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-2xs font-medium text-sky tracking-wide">وسيط توريد — ليس منظّم مناسبات</p>
          <h2 className="text-lg sm:text-xl font-bold mt-0.5">كيف يشتغل يوصل</h2>
        </div>
        <p className="text-2xs sm:text-xs text-white/60 max-w-md leading-relaxed">
          اختر → احجز بسعر نهائي → نتابع التوريد
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-action text-white flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xs font-medium text-sand">
                  الخطوة {step.n}
                </p>
                <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
                <p className="text-2xs sm:text-xs text-white/70 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
