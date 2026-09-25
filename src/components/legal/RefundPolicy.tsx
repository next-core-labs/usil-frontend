import React, { useEffect } from 'react';
import { applySeo } from '../../utils/seo';
import { REFUND_TIERS } from '../../contracts/shared/refund-policy';

interface LegalPageProps {
  onBack: () => void;
}

export const RefundPolicy: React.FC<LegalPageProps> = ({ onBack }) => {
  useEffect(() => {
    applySeo('refund');
    return () => applySeo('home');
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl text-right" dir="rtl">
      <button type="button" onClick={onBack} className="text-sm font-bold text-action mb-6">
        ← العودة للسوق
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">سياسة الاسترجاع</h1>
      <p className="text-xs text-ink-3 mb-4">يوصل / Usil · آخر تحديث: 8 سبتمبر 2026 · https://usil.app</p>
      <p className="text-xs text-ink-3 mb-8 rounded-2xl border border-line bg-paper p-3 leading-relaxed">
        هذه الصفحة مسوّدة عمل لمنصة يوصل، وليست استشارة قانونية معتمدة. تُعرض على محامٍ سعودي مرخّص
        قبل الاعتماد النهائي.
      </p>
      <div className="space-y-6 text-sm text-ink-1 leading-relaxed">
        <p>
          يوصل وسيط توريد مناسبات. الدفع الإلكتروني يتم عبر ميسر (مدى / آبل باي / STC Pay). البطاقة لا تمر
          على سيرفر يوصل. النسب تُحسب على المبلغ المدفوع (الخدمة + ضريبة القيمة المضافة)، والمهلة بأيام
          كاملة حسب تقويم الرياض حتى تاريخ المناسبة.
        </p>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">إلغاء العميل — المهل والنسب</h2>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-right text-sm">
              <thead className="bg-paper">
                <tr>
                  <th className="p-3 font-bold text-navy">مهلة الإلغاء</th>
                  <th className="p-3 font-bold text-navy">يسترجع العميل</th>
                  <th className="p-3 font-bold text-navy">يستحق المورّد</th>
                </tr>
              </thead>
              <tbody>
                {REFUND_TIERS.map((tier) => (
                  <tr key={tier.window} className="border-t border-line">
                    <td className="p-3">{tier.window}</td>
                    <td className="p-3 font-bold">{tier.customer}</td>
                    <td className="p-3">{tier.vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            يُعاد المبلغ بنفس وسيلة الدفع خلال 3 إلى 10 أيام عمل حسب بوابة ميسر والبنك المصدر. المبلغ
            المعتمد هو ما تؤكده ميسر، لا تقديرًا يُحسب في المتصفح.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">إلغاء المورّد أو التخلّف عن التنفيذ</h2>
          <p>
            إذا ألغى مورّد معتمد حجزًا مؤكدًا، أو تخلّف عن التنفيذ، يُسترجع للعميل كامل المبلغ الذي تؤكده
            ميسر، ويوصل ينسّق البديل وفق سياسة الضمان المعروضة عند الدفع. الإلغاء المتكرر يعرّض حساب
            المورّد للإيقاف.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">الخدمة غير المطابقة</h2>
          <p>
            إذا نُفذت الخدمة بشكل مخالف جوهريًا للوصف المعلن، افتح طلبًا من{' '}
            <a href="/support" className="text-action font-bold hover:underline">
              صفحة الدعم
            </a>{' '}
            خلال 48 ساعة من موعد التوريد مع الأدلة. تراجع الإدارة الحالة وتقرر الاسترجاع الكلي أو الجزئي.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">الظروف الاستثنائية</h2>
          <p>
            في القوة القاهرة (قرارات جهة مختصة، كوارث، حالات وفاة) تُدرس كل حالة على حدة، وقد يُسترجع كامل
            المبلغ خارج الجدول أعلاه.
          </p>
        </section>

        <p>
          للاستفسار: hello@usil.app أو{' '}
          <a href="/support" className="text-action font-bold hover:underline">
            الدعم والتواصل
          </a>
          . الشروط العامة في{' '}
          <a href="/terms" className="text-action font-bold hover:underline">
            شروط الاستخدام
          </a>
          .
        </p>
      </div>
    </article>
  );
};
