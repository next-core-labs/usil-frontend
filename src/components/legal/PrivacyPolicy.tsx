import React, { useEffect } from 'react';
import { applySeo } from '../../utils/seo';

interface LegalPageProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<LegalPageProps> = ({ onBack }) => {
  useEffect(() => {
    applySeo('privacy');
    return () => applySeo('home');
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl text-right" dir="rtl">
      <button type="button" onClick={onBack} className="text-sm font-bold text-[#155EEF] mb-6">
        ← العودة للسوق
      </button>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1A33] mb-2">سياسة الخصوصية</h1>
      <p className="text-xs text-[#667085] mb-8">يوصل / Usil · آخر تحديث: سبتمبر 2026 · https://usil.app</p>
      <div className="space-y-5 text-sm text-[#344054] leading-relaxed">
        <p>
          تجمع يوصل بيانات الحساب لتنفيذ الحجوزات: الاسم، البريد، رقم الجوال، وكلمة المرور المخزّنة بشكل مُجزّأ.
          قد تُستخدم المدينة وتاريخ المناسبة وعدد الضيوف لمطابقة المورّدين.
        </p>
        <p>
          لا نبيع بياناتك لإعلانات طرف ثالث، ولا نتتبّعك عبر تطبيقات أو مواقع شركات أخرى. الاستخدام لتشغيل الحساب،
          منع الاحتيال، ودعم العملاء.
        </p>
        <p>
          الكاميرا أو الموقع يُطلبان فقط داخل ميزات واضحة (مسح باركود، تأكيد وصول الطاقم) وبموافقة النظام.
        </p>
        <p>
          للاستفسار أو طلب حذف الحساب: راسلنا من صفحة الدعم على يوصل، أو عبر البريد
          hello@usil.app الظاهر في التذييل.
        </p>
        <p>البيانات تُعالج في المملكة العربية السعودية وعلى خوادم تشغيل الموقع.</p>
      </div>
    </article>
  );
};
