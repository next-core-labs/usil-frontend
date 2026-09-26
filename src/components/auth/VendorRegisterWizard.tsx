import React, { useState } from 'react';
import { controlClass } from '../ui/Field';
import { ArrowLeft, ArrowRight, CheckCircle2, Store, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UsilLockup } from '../UsilLockup';
import { emptyVendorRegisterForm, PROJECT_TYPES, SAUDI_BANKS, type VendorRegisterForm } from '../../data/vendorOnboarding';
import { FulfillmentLanePicker } from '../FulfillmentLanePicker';
import { VendorSocialsForm } from '../vendor/VendorSocialsForm';
import { VendorOwnFileCard } from '../vendor/VendorOwnFileCard';
import { ProductImagesPicker } from '../vendor/ProductImagesPicker';
import { LISTING_CATEGORIES, LISTING_PRICE_UNITS, LISTING_MIN_IMAGES, DEFAULT_BOOKING_MODE } from '../../contracts/vendors/vendor-listings';
import type { SocialNetwork } from '../../contracts/vendors/vendor-socials';
import type { VendorOwnProfile } from '../../contracts/vendors/vendor-profile';
import type { SessionUser } from '../../LoginScreen';

const inputClass = controlClass;

export function VendorRegisterWizard({
  onClose,
  onSubmitted,
  onLoggedIn,
  onOpenCourierRegister,
}: {
  onClose: () => void;
  onSubmitted?: () => void;
  onLoggedIn?: (user: SessionUser) => void;
  onOpenCourierRegister?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<VendorRegisterForm>(emptyVendorRegisterForm);
  const [listingTitle, setListingTitle] = useState('');
  const [listingCategory, setListingCategory] = useState<(typeof LISTING_CATEGORIES)[number]['id']>('hospitality');
  const [listingShortDesc, setListingShortDesc] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingPriceUnit, setListingPriceUnit] = useState<(typeof LISTING_PRICE_UNITS)[number]>('للمناسبة');
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [listingUploading, setListingUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ownProfile, setOwnProfile] = useState<VendorOwnProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const set = (key: keyof VendorRegisterForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!form.firstName.trim() || !form.fatherName.trim() || !form.familyName.trim()) {
      return 'اكتب الاسم الأول واسم الأب واسم العائلة';
    }
    if (!form.projectName.trim()) return 'اكتب اسم المشروع';
    if (!/^[12]\d{9}$/.test(form.nationalId.replace(/\s+/g, ''))) {
      return 'رقم الهوية أو الإقامة يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2';
    }
    if (!form.email.trim() || !form.email.includes('@')) return 'أدخل بريداً إلكترونياً صحيحاً';
    if (!form.phone.trim()) return 'أدخل رقم الجوال';
    if (form.password.length < 8) return 'الرقم السري يجب ألا يقل عن 8 خانات';
    if (!form.passwordConfirm) return 'أكد الرقم السري';
    if (form.password !== form.passwordConfirm) return 'تأكيد الرقم السري لا يطابق الرقم السري';
    if (!form.projectType) return 'اختر نوع المشروع';
    if (form.projectType === 'أخرى' && !form.projectTypeOther.trim()) {
      return 'اكتب نوع المشروع في خانة الأخرى';
    }
    return '';
  };

  const validateStep2 = () => {
    if (!form.projectType) return 'اختر نوع المشروع';
    if (form.projectType === 'أخرى' && !form.projectTypeOther.trim()) {
      return 'اكتب نوع المشروع في الخانة الفارغة';
    }
    if (!form.projectName.trim()) return 'اكتب اسم المشروع';
    if (!form.bankName) return 'اختر البنك';
    if (!/^SA\d{22}$/i.test(form.iban.replace(/\s+/g, ''))) {
      return 'رقم الآيبان يجب أن يبدأ بـ SA ويتبعه 22 رقماً';
    }
    if (!form.accountHolderName.trim()) return 'اكتب اسم صاحب الحساب';
    if (!form.fulfillment.length) return 'اختر مساراً واحداً على الأقل في «أقدر أخدم في»';
    if (![form.instagram, form.tiktok, form.snapchat, form.x, form.youtube, form.whatsapp].some((v) => v.trim())) {
      return 'اربط حساب تواصل واحد على الأقل عشان العميل يشوفه في ملف المورد';
    }
    return '';
  };

  const validateStep3 = () => {
    if (!listingTitle.trim()) return 'اكتب اسم المنتج';
    const price = Number(listingPrice);
    if (!Number.isFinite(price) || price <= 0) return 'أدخل سعراً أكبر من صفر بالريال';
    if (listingImages.length < LISTING_MIN_IMAGES) return 'ارفع صورتين حقيقيتين للمنتج من جهازك';
    if (listingUploading) return 'انتظر انتهاء تجهيز الصور';
    return '';
  };

  const goNext = () => {
    const message = step === 1 ? validateStep1() : validateStep2();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((prev) => (prev === 1 ? 2 : 3));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = validateStep3();
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vendor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          listing: {
            title: listingTitle.trim(),
            category: listingCategory,
            shortDesc: listingShortDesc.trim() || listingTitle.trim(),
            price: Number(listingPrice),
            priceUnit: listingPriceUnit,
            cities: ['الرياض'],
            images: listingImages,
            fulfillment: form.fulfillment,
            bookingMode: DEFAULT_BOOKING_MODE,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر إرسال الطلب');
        return;
      }
      if (data.profile) setOwnProfile(data.profile as VendorOwnProfile);
      if (data.user && onLoggedIn) onLoggedIn(data.user as SessionUser);
      setDone(true);
      onSubmitted?.();
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[90] bg-navy/80 backdrop-blur-sm overflow-y-auto usil-safe-overlay">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-line shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <UsilLockup compact />
              <div>
                <p className="text-2xs font-medium text-action">انضمام مورّد — مراجعة قبل التفعيل</p>
                <h2 className="text-xl font-bold text-navy">تسجيل مورد جديد</h2>
              </div>
            </div>
            <div className="mb-5 rounded-xl border border-line bg-paper p-3 text-2xs text-ink-1 leading-relaxed">
              <p className="font-bold text-navy mb-1">الحساب يبقى معلّقًا حتى موافقة الإدارة.</p>
              <p>
                جهّز للرفع عند المراجعة: السجل التجاري أو وثيقة العمل الحر، رخصة البلدية، وتصريح المطبخ من الغذاء والدواء إن كنت تقدّم بوفيه أو طعامًا. يوصل وسيط توريد — لا ننفّذ المناسبة نيابة عنك.
              </p>
            </div>

            {done ? (
              <div className="py-4 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold">هذا ملفك من اللي سجّلته</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    حفظنا منتجك بصورته وسعره. يظهر في السوق بعد موافقة الإدارة — بدون صور أو أسعار وهمية.
                  </p>
                </div>
                {ownProfile ? <VendorOwnFileCard profile={ownProfile} /> : null}
                <button type="button" onClick={onClose} className="w-full mt-2 px-5 py-2.5 rounded-xl bg-action text-white text-sm font-bold">
                  حسناً
                </button>
                {onOpenCourierRegister ? (
                  <button
                    type="button"
                    onClick={onOpenCourierRegister}
                    className="block mx-auto text-xs font-medium text-action"
                  >
                    أو سجّل كمندوب توصيل
                  </button>
                ) : null}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-action text-white' : 'bg-slate-100 text-slate-500'}`}>1. بيانات المورّد</span>
                  <span className="text-slate-300">—</span>
                  <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-action text-white' : 'bg-slate-100 text-slate-500'}`}>2. المشروع والحساب</span>
                  <span className="text-slate-300">—</span>
                  <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-action text-white' : 'bg-slate-100 text-slate-500'}`}>3. المنتج والسعر</span>
                </div>

                {step === 1 ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="الاسم الأول" value={form.firstName} onChange={(v) => set('firstName', v)} />
                    <Field label="اسم الأب" value={form.fatherName} onChange={(v) => set('fatherName', v)} />
                    <Field label="اسم العائلة" value={form.familyName} onChange={(v) => set('familyName', v)} />
                    <div className="sm:col-span-3">
                      <Field label="اسم المشروع" value={form.projectName} onChange={(v) => set('projectName', v)} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm">
                        <span className="text-slate-600 mb-1.5 block font-bold">نوع المشروع</span>
                        <select className={inputClass} value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
                          <option value="">اختر نوع المشروع — حفلات ومعارض وكل الخدمات</option>
                          {PROJECT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {form.projectType === 'أخرى' ? (
                      <div className="sm:col-span-3">
                        <Field label="وش الأخرى؟ اكتب نوع مشروعك" value={form.projectTypeOther} onChange={(v) => set('projectTypeOther', v)} placeholder="اكتب نوع الخدمة أو المناسبة" />
                      </div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <Field label="رقم الهوية أو الإقامة" value={form.nationalId} onChange={(v) => set('nationalId', v)} dir="ltr" placeholder="1xxxxxxxxx" />
                    </div>
                    <Field label="السجل التجاري إن وجد" value={form.commercialRegister} onChange={(v) => set('commercialRegister', v)} required={false} />
                    <div className="sm:col-span-2">
                      <Field label="البريد الإلكتروني" type="email" value={form.email} onChange={(v) => set('email', v)} dir="ltr" />
                    </div>
                    <Field label="رقم الجوال" value={form.phone} onChange={(v) => set('phone', v)} dir="ltr" placeholder="05xxxxxxxx" />
                    <div className="sm:col-span-3">
                      <label className="block text-sm">
                        <span className="text-slate-600 mb-1.5 block font-bold">شعار أو صورة المشروع (اختياري)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="w-full text-xs"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              set('logoDataUrl', '');
                              return;
                            }
                            if (file.size > 2 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
                              setError('ارفع صورة jpg أو png أو webp حتى 2 ميغابايت.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => set('logoDataUrl', String(reader.result || ''));
                            reader.readAsDataURL(file);
                          }}
                        />
                        <p className="text-2xs text-slate-500 mt-1">اختياري. إن ما رفعت شعاراً ما نولّد صورة وهمية.</p>
                        {form.logoDataUrl ? (
                          <img src={form.logoDataUrl} alt="شعار المشروع" className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-200" />
                        ) : null}
                      </label>
                    </div>
                    <div className="sm:col-span-3 sm:grid sm:grid-cols-2 gap-3 space-y-3 sm:space-y-0">
                      <PasswordField
                        label="الرقم السري للدخول بعد الموافقة"
                        value={form.password}
                        onChange={(v) => set('password', v)}
                        visible={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                      />
                      <PasswordField
                        label="تأكيد الرقم السري"
                        value={form.passwordConfirm}
                        onChange={(v) => set('passwordConfirm', v)}
                        visible={showPasswordConfirm}
                        onToggle={() => setShowPasswordConfirm((v) => !v)}
                      />
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-3">
                    <label className="block text-sm">
                      <span className="text-slate-600 mb-1.5 block font-bold">نوع المشروع</span>
                      <select className={inputClass} value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
                        <option value="">اختر نوع المشروع</option>
                        {PROJECT_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    {form.projectType === 'أخرى' ? (
                      <Field label="وش الأخرى؟ اكتب نوع مشروعك" value={form.projectTypeOther} onChange={(v) => set('projectTypeOther', v)} placeholder="اكتب نوع الخدمة أو المناسبة" />
                    ) : null}
                    <Field label="اسم المشروع" value={form.projectName} onChange={(v) => set('projectName', v)} />
                    <label className="block text-sm">
                      <span className="text-slate-600 mb-1.5 block font-bold">الحساب البنكي — اختر البنك</span>
                      <select className={inputClass} value={form.bankName} onChange={(e) => set('bankName', e.target.value)}>
                        <option value="">كل البنوك السعودية</option>
                        {SAUDI_BANKS.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </label>
                    <Field label="رقم الآيبان" value={form.iban} onChange={(v) => set('iban', v)} dir="ltr" placeholder="SAxxxxxxxxxxxxxxxxxxxxxx" />
                    <Field label="اسم صاحب الحساب" value={form.accountHolderName} onChange={(v) => set('accountHolderName', v)} />
                    <FulfillmentLanePicker
                      value={form.fulfillment}
                      onChange={(next) => {
                        setForm((prev) => ({ ...prev, fulfillment: next }));
                        setError('');
                      }}
                    />
                    <VendorSocialsForm
                      values={{
                        instagram: form.instagram,
                        tiktok: form.tiktok,
                        snapchat: form.snapchat,
                        x: form.x,
                        youtube: form.youtube,
                        whatsapp: form.whatsapp,
                      }}
                      onChange={(network: SocialNetwork, value) => set(network, value)}
                      confirmedOwn={form.confirmedOwn}
                      onConfirmedOwnChange={(value) => set('confirmedOwn', value)}
                      requireOneHint
                    />
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-2xs text-amber-950 leading-relaxed space-y-1">
                      <p className="font-bold">الوثائق المطلوبة قبل التفعيل (تُرفع لفريق المراجعة أو تُرسل بعد الطلب):</p>
                      <ul className="list-disc pr-4 space-y-0.5">
                        <li>السجل التجاري أو وثيقة العمل الحر</li>
                        <li>رخصة البلدية للمنشأة</li>
                        <li>تصريح المطبخ / الغذاء والدواء إن كان النشاط بوفيه أو طعامًا</li>
                      </ul>
                      <p>بدون هذه الوثائق يبقى الحساب معلّقًا ولا يظهر في السوق.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-line bg-paper p-3 text-2xs text-ink-1 leading-relaxed">
                      <p className="font-bold text-navy mb-1">منتجك الأول — صور حقيقية وسعر بالريال</p>
                      <p>ارفع صورتين من جهازك واكتب السعر. البطاقة ما تظهر في السوق إلا بعد موافقة الإدارة وعلى هذا المبلغ.</p>
                    </div>
                    <Field label="اسم المنتج" value={listingTitle} onChange={setListingTitle} placeholder="مثال: قهوة سعودية جاهزة" />
                    <label className="block text-sm">
                      <span className="text-slate-600 mb-1.5 block font-bold">قسم المنتج</span>
                      <select
                        className={inputClass}
                        value={listingCategory}
                        onChange={(e) => setListingCategory(e.target.value as (typeof LISTING_CATEGORIES)[number]['id'])}
                      >
                        {LISTING_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </label>
                    <Field label="وصف قصير" value={listingShortDesc} onChange={setListingShortDesc} placeholder="وش يوصل العميل مع هذا المنتج" required={false} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="السعر بالريال" value={listingPrice} onChange={setListingPrice} dir="ltr" placeholder="0" />
                      <label className="block text-sm">
                        <span className="text-slate-600 mb-1.5 block font-bold">وحدة السعر</span>
                        <select
                          className={inputClass}
                          value={listingPriceUnit}
                          onChange={(e) => setListingPriceUnit(e.target.value as (typeof LISTING_PRICE_UNITS)[number])}
                        >
                          {LISTING_PRICE_UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <ProductImagesPicker
                      value={listingImages}
                      onChange={setListingImages}
                      onUploadingChange={setListingUploading}
                      deferUpload
                    />
                  </div>
                )}

                {error ? (
                  <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ) : null}

                {onOpenCourierRegister ? (
                  <button
                    type="button"
                    onClick={onOpenCourierRegister}
                    className="w-full text-xs font-medium text-action hover:underline"
                  >
                    لست مورّداً؟ سجّل كمندوب توصيل (اسم، عائلة، هوية، لوحة، نوع سيارة)
                  </button>
                ) : null}

                <div className="flex items-center justify-between gap-3 pt-2">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold inline-flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      رجوع
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={goNext} className="px-5 py-2.5 rounded-xl bg-action text-white text-sm font-bold inline-flex items-center gap-2">
                      {step === 1 ? 'الصفحة الثانية' : 'المنتج والصور'}
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={loading || listingUploading} className="px-5 py-2.5 rounded-xl bg-action text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
                      <Store className="w-4 h-4" />
                      {loading ? 'جارٍ الإرسال…' : 'إرسال لإدارة يوصل'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 mb-1.5 block font-bold">
        {label}
        {required ? '' : ' '}
        {!required ? <span className="text-slate-400 font-normal">(اختياري)</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
        dir={dir}
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 mb-1.5 block font-bold">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pl-12`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          aria-label={visible ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}
