import React, { useEffect } from 'react';
import { applySeo } from '../../utils/seo';

interface LegalPageProps {
  onBack: () => void;
}

export const TermsOfUse: React.FC<LegalPageProps> = ({ onBack }) => {
  useEffect(() => {
    applySeo('terms');
    return () => applySeo('home');
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl text-right" dir="rtl">
      <button type="button" onClick={onBack} className="text-sm font-bold text-action mb-6">
        ← العودة للسوق
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">شروط الاستخدام</h1>
      <p className="text-xs text-ink-3 mb-4">يوصل وسيط توريد مناسبات. لا ينظّم الحفل نيابة عنك. آخر تحديث: 8 سبتمبر 2026.</p>
      <p className="text-xs text-ink-3 mb-8 rounded-2xl border border-line bg-paper p-3 leading-relaxed">
        هذه الصفحة مسوّدة عمل لمنصة يوصل، وليست استشارة قانونية معتمدة.
      </p>
      <div className="space-y-5 text-sm text-ink-1 leading-relaxed">
        <p>
          الأسعار المعروضة تشمل ضريبة القيمة المضافة 15% والتجهيز ما لم يُذكر خلاف ذلك على البطاقة.
          الدفع كامل عبر ميسر عند الحجز، لا عربون منفصل.
        </p>
        <p>
          إلغاء العميل: استرجاع كامل قبل 7 أيام أو أكثر من موعد المناسبة، و50٪ من 3 أيام إلى أقل من 7،
          ولا استرجاع لأقل من 3 أيام. اعتذار المورّد يعيد كامل ما تؤكده ميسر. التفاصيل في{' '}
          <a href="/refund" className="text-action font-bold hover:underline">
            سياسة الاسترجاع
          </a>
          .
        </p>
        <p>إذا تخلّف مورّد معتمد عن التنفيذ، يوصل ينسّق البديل وفق سياسة الضمان المعروضة عند الدفع.</p>
        <p>المورّد مسؤول عن التراخيص (بلدية، غذاء ودواء للبوفيه). المنصة تراجع طلبات التسجيل قبل التفعيل.</p>
      </div>
    </article>
  );
};
