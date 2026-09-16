import React, { useState } from 'react';
import { controlClass } from '../ui/Field';
import { AlertCircle, Bike, CheckCircle2, ClipboardList, Plus, Trash2, X } from 'lucide-react';
import { UsilLockup } from '../UsilLockup';
import { ExternalBookingForm } from '../courier/ExternalBookingForm';
import { FulfillmentLanePicker } from '../FulfillmentLanePicker';
import { FulfillmentLane } from '../../types';

const inputClass = controlClass;

const CAR_TYPES = ['سيدان', 'دفع رباعي', 'فان', 'دباب/سكوتر', 'بيك أب', 'أخرى'] as const;
const PLATE_LETTERS = ['ا', 'ب', 'ح', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ى'] as const;

type ProductLine = { name: string; fulfillment: FulfillmentLane[] };

type FormState = {
  firstName: string;
  familyName: string;
  nationalId: string;
  plateLetters: string;
  plateNumbers: string;
  carType: string;
  carTypeOther: string;
  fulfillment: FulfillmentLane[];
  products: ProductLine[];
};

const emptyForm = (): FormState => ({
  firstName: '',
  familyName: '',
  nationalId: '',
  plateLetters: '',
  plateNumbers: '',
  carType: '',
  carTypeOther: '',
  fulfillment: [],
  products: [],
});

function clientValidate(form: FormState): string {
  if (!form.firstName.trim()) return 'اكتب الاسم';
  if (!form.familyName.trim()) return 'اكتب اسم العائلة';
  if (!/^[12]\d{9}$/.test(form.nationalId.replace(/\s+/g, ''))) {
    return 'رقم الهوية أو الإقامة يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2';
  }
  const letters = form.plateLetters.replace(/[^\u0621-\u064A]/g, '');
  if (!letters || letters.length > 3 || [...letters].some((letter) => !(PLATE_LETTERS as readonly string[]).includes(letter))) {
    return 'حروف اللوحة: اكتب حرفاً إلى ثلاثة من حروف اللوحة السعودية';
  }
  if (!/^\d{1,4}$/.test(form.plateNumbers.replace(/\D/g, ''))) {
    return 'رقم اللوحة يجب أن يكون من رقم إلى أربعة أرقام';
  }
  if (!form.carType) return 'اختر نوع السيارة';
  if (form.carType === 'أخرى' && !form.carTypeOther.trim()) return 'اكتب نوع السيارة في الخانة الفارغة';
  if (!form.fulfillment.length) return 'اختر مساراً واحداً على الأقل في «أقدر أوصل»';
  return '';
}

export function CourierRegisterForm({
  onClose,
  canFileExternal = false,
  defaultTab = 'apply',
}: {
  onClose: () => void;
  canFileExternal?: boolean;
  defaultTab?: 'apply' | 'external';
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tab, setTab] = useState<'apply' | 'external'>(canFileExternal ? defaultTab : 'apply');

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = clientValidate(form);
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/couriers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          familyName: form.familyName.trim(),
          nationalId: form.nationalId.replace(/\s+/g, ''),
          plateLetters: form.plateLetters,
          plateNumbers: form.plateNumbers,
          carType: form.carType,
          carTypeOther: form.carType === 'أخرى' ? form.carTypeOther.trim() : undefined,
          fulfillment: form.fulfillment,
          products: form.products
            .filter((row) => row.name.trim() || row.fulfillment.length)
            .map((row) => ({
              name: row.name.trim(),
              fulfillment: row.fulfillment.length ? row.fulfillment : form.fulfillment,
            })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر إرسال الطلب');
        return;
      }
      setDone(true);
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[90] bg-navy/80 backdrop-blur-sm overflow-y-auto usil-safe-overlay">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-line shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4 ps-10">
              <UsilLockup compact />
              <div className="min-w-0">
                <p className="text-2xs font-medium text-action">
                  {tab === 'external' ? 'حجوزات خارجية — سجّل الحجز اللي جاك بره المنصة' : 'انضمام مندوب توصيل — مراجعة قبل التفعيل'}
                </p>
                <h2 className="text-xl font-bold text-navy">
                  {tab === 'external' ? 'تسجيل حجز خارجي' : 'سجّل معنا كمندوب توصيل'}
                </h2>
              </div>
            </div>

            {canFileExternal ? (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setTab('apply')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${
                    tab === 'apply' ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  تسجيل مندوب
                </button>
                <button
                  type="button"
                  onClick={() => setTab('external')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${
                    tab === 'external' ? 'bg-navy text-white border-navy' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  تسجيل حجز خارجي
                </button>
              </div>
            ) : null}

            {tab === 'external' ? (
              <ExternalBookingForm variant="plain" />
            ) : (
            <>
            <p className="mb-5 text-xs text-ink-1 leading-relaxed">
              املأ الاسم والعائلة والهوية أو الإقامة وحروف ورقم اللوحة ونوع السيارة. الطلب يبقى معلّقاً حتى توافق إدارة يوصل.
            </p>

            {done ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-navy">استلمنا طلبك — نراجع البيانات ونتواصل معك</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  لن تُفعَّل كمندوب توصيل حتى تراجع الإدارة الطلب. لا تحتاج حساب عميل لهذا التسجيل.
                </p>
                <button type="button" onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl bg-action text-white text-sm font-bold">
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-slate-600 mb-1.5 block font-bold">الاسم</span>
                    <input
                      className={inputClass}
                      value={form.firstName}
                      onChange={(e) => set('firstName', e.target.value)}
                      placeholder="الاسم الأول"
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 mb-1.5 block font-bold">العائلة</span>
                    <input
                      className={inputClass}
                      value={form.familyName}
                      onChange={(e) => set('familyName', e.target.value)}
                      placeholder="اسم العائلة"
                      autoComplete="family-name"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-slate-600 mb-1.5 block font-bold">الهوية أو الإقامة</span>
                    <input
                      className={`${inputClass} font-mono`}
                      value={form.nationalId}
                      onChange={(e) => set('nationalId', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="1xxxxxxxxx أو 2xxxxxxxxx"
                      inputMode="numeric"
                      dir="ltr"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 mb-1.5 block font-bold">حروف اللوحة</span>
                    <input
                      className={inputClass}
                      value={form.plateLetters}
                      onChange={(e) => set('plateLetters', e.target.value)}
                      placeholder="مثال: ب ر د"
                      dir="rtl"
                    />
                    <span className="mt-1 block text-2xs text-slate-400 leading-relaxed">
                      الحروف المعتمدة: ا ب ح د ر س ص ط ع ق ك ل م ن ه و ى
                    </span>
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 mb-1.5 block font-bold">رقم اللوحة</span>
                    <input
                      className={`${inputClass} font-mono`}
                      value={form.plateNumbers}
                      onChange={(e) => set('plateNumbers', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="1234"
                      inputMode="numeric"
                      dir="ltr"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-slate-600 mb-1.5 block font-bold">نوع السيارة</span>
                    <select className={inputClass} value={form.carType} onChange={(e) => set('carType', e.target.value)}>
                      <option value="">اختر نوع السيارة</option>
                      {CAR_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.carType === 'أخرى' ? (
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-slate-600 mb-1.5 block font-bold">اكتب نوع السيارة</span>
                      <input
                        className={inputClass}
                        value={form.carTypeOther}
                        onChange={(e) => set('carTypeOther', e.target.value)}
                        placeholder="اختياري إن اخترت أخرى — مطلوب لإكمال الطلب"
                      />
                    </label>
                  ) : (
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-slate-600 mb-1.5 block font-bold">
                        وصف إضافي للسيارة <span className="text-slate-400 font-normal">(اختياري)</span>
                      </span>
                      <input
                        className={inputClass}
                        value={form.carTypeOther}
                        onChange={(e) => set('carTypeOther', e.target.value)}
                        placeholder="لون أو موديل إن رغبت"
                      />
                    </label>
                  )}
                </div>

                <section className="rounded-2xl border border-line p-3 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-navy">المنتجات اللي أوصّلها</h3>
                    <p className="text-2xs text-ink-2 mt-0.5">
                      حدّد مسارات يوصل التي تقدر تغطيها. تقدر تضيف أسماء منتجات إن حبيت.
                    </p>
                  </div>
                  <FulfillmentLanePicker
                    heading="أقدر أوصل:"
                    required
                    variant="chips"
                    hint="يوصل ساعة · يوصل اليوم · يوصل بكرا · حجز فوري"
                    value={form.fulfillment}
                    onChange={(next) => {
                      setForm((prev) => ({ ...prev, fulfillment: next }));
                      setError('');
                    }}
                  />
                  <div className="space-y-2">
                    {form.products.map((row, index) => (
                      <div key={`crr-prod-${index}`} className="rounded-xl border border-line bg-paper p-2.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            className={inputClass}
                            value={row.name}
                            onChange={(e) => {
                              const products = [...form.products];
                              products[index] = { ...products[index], name: e.target.value };
                              setForm((prev) => ({ ...prev, products }));
                            }}
                            placeholder="اسم المنتج (اختياري) — مثال: قهوة"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                products: prev.products.filter((_, i) => i !== index),
                              }))
                            }
                            className="w-10 h-10 shrink-0 rounded-xl bg-white border border-line text-rose-600 inline-flex items-center justify-center"
                            aria-label="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <FulfillmentLanePicker
                          heading="مسار يوصل لهذا المنتج"
                          variant="chips"
                          hint=""
                          value={row.fulfillment}
                          onChange={(next) => {
                            const products = [...form.products];
                            products[index] = { ...products[index], fulfillment: next };
                            setForm((prev) => ({ ...prev, products }));
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          products: [...prev.products, { name: '', fulfillment: [...prev.fulfillment] }],
                        }))
                      }
                      className="h-10 px-3 rounded-xl bg-white border border-line text-action text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة منتج
                    </button>
                  </div>
                </section>

                {error ? (
                  <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-xl bg-action hover:bg-action-hover text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Bike className="w-4 h-4" />
                  {loading ? 'جارٍ الإرسال…' : 'إرسال طلب المندوب'}
                </button>
              </form>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
