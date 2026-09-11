import React from 'react';
import { TESTIMONIALS } from '../data/services';
import { ShieldCheck, CalendarCheck, Award, HeartHandshake, PhoneCall, Star, CheckCircle2 } from 'lucide-react';

export const TrustAndExperience: React.FC = () => {
  const steps = [
    {
      title: 'استعراض واختيار المورّدين',
      desc: 'تصفح باقات الضيافة السعودية، البوفيهات، وتجهيز المسارح بأسعار واضحة ومحددة وشاملة للضريبة والتوصيل.',
      icon: CalendarCheck,
    },
    {
      title: 'تخصيص الموعد وعدد الضيوف',
      desc: 'حدد تاريخ مناسبتك، سعة الحضور، والمدينة مع إمكانية إضافة أي متطلبات خاصة مباشرة دون مفاوضات معقدة.',
      icon: Award,
    },
    {
      title: 'ضمان الوصول والتنفيذ الفعلي',
      desc: 'يصل طاقم التجهيز والمباشرين قبل موعد مناسبتك بوقت كافٍ، ولا يُصرف المبلغ للمورّد إلا بعد التحقق من اكتمال العمل.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-14 py-6 text-right">
      
      {/* 3-Step Clear Operational Flow */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
          <HeartHandshake className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>آلية الحجز والتشغيل المضمونة</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0A1A33] tracking-tight">
          اختر → احجز بسعر نهائي → نتابع التوريد
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto font-normal">
          يوصل وسيط توريد: نطابق المورّد ونضمن الوصول. لا نصبح منظّم مناسبات نيابة عنك.
        </p>

        <div className="grid md:grid-cols-3 gap-6 pt-4 text-right">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 card-shadow hover:card-shadow-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#155EEF]" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {TESTIMONIALS.length > 0 ? (
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-[#155EEF] block mb-1">
              تجارب حية من الميدان
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              من الاختيار حتى وصول المورّد — بسعر نهائي
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800 font-bold bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>تقييم كل مورّد يظهر على بطاقته</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 pt-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold font-mono">{t.city}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <span className="text-[11px] text-[#155EEF] font-semibold">{t.event}</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>حجز موثق</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {/* Support & Escrow Guarantee Banner */}
      <div className="p-6 sm:p-7 rounded-xl bg-[#0A1A33] text-white flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-right">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#155EEF] shrink-0 border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-base font-display font-extrabold text-white">ضمان يوصل: إذا تخلّف مورّد نتحمّل المسؤولية</h4>
            <p className="text-xs text-slate-300 font-normal mt-0.5">
              جميع مزودي الخدمات يخضعون لفحص الجاهزية والاعتماد الميداني لضمان دقة المواعيد واحترافية التقديم.
            </p>
          </div>
        </div>

        <a
          href="/support"
          className="px-5 py-3 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          <span>راسل دعم يوصل</span>
        </a>
      </div>

    </div>
  );
};
