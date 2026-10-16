import React, { useState } from 'react';
import { controlClass } from '../ui/Field';
import { AlertCircle, CheckCircle2, ExternalLink, Eye, EyeOff, Store, X } from 'lucide-react';
import { UsilLockup } from '../UsilLockup';
import { PROJECT_TYPES } from '../../data/vendorOnboarding';
import { vendorConsoleUrl } from '../../utils/vendorConsole';
import type { SessionUser } from '../../LoginScreen';

const inputClass = controlClass;
const PASSWORD_MIN_LENGTH = 8;

/** A random password the server never stores — see `account`. */
function unusedPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * «انضم كمورّد»: the same short sign-up as the vendor console
 * (`POST /api/vendor-signup`). Products, ID, bank and socials are added in the
 * vendor console afterwards, and the owner approves once the file is complete.
 *
 * With `account` (already signed in to the store), the store is opened on that
 * account: email and phone stay its own, and its password is never rewritten.
 */
export function VendorRegisterWizard({
  account = null,
  onClose,
  onLoggedIn,
  onOpenCourierRegister,
}: {
  account?: { name: string; email: string; phone: string } | null;
  onClose: () => void;
  onLoggedIn?: (user: SessionUser) => void;
  onOpenCourierRegister?: () => void;
}) {
  const signedIn = Boolean(account);
  const [form, setForm] = useState({
    name: account?.name || '',
    projectName: '',
    projectType: '',
    projectTypeOther: '',
    email: account?.email || '',
    phone: account?.phone || '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signedIn) {
      if (form.password.length < PASSWORD_MIN_LENGTH) {
        setError(`الرقم السري يجب ألا يقل عن ${PASSWORD_MIN_LENGTH} خانات`);
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setError('تأكيد الرقم السري لا يطابق الرقم السري');
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      const { passwordConfirm: _confirm, ...draft } = form;
      const res = await fetch('/api/vendor-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, password: signedIn ? unusedPassword() : form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر التسجيل');
        return;
      }
      if (data.user && onLoggedIn) onLoggedIn(data.user as SessionUser);
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
        <div className="w-full max-w-lg bg-white rounded-3xl border border-line shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <UsilLockup compact />
              <div>
                <p className="text-2xs font-medium text-action">انضمام مورّد</p>
                <h2 className="text-xl font-bold text-navy">{done ? 'تم فتح متجرك' : 'افتح متجرك في يوصل'}</h2>
              </div>
            </div>

            {done ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-relaxed text-emerald-950">
                    أهلاً بك في يوصل! حسابك جاهز. كمّل من لوحة المورّد — متجرك يظهر للعملاء بعد موافقة الإدارة.
                  </p>
                </div>
                <ol className="space-y-2 text-sm text-ink-1">
                  {[
                    'ادخل لوحة المورّد بنفس البريد والرقم السري',
                    'أضف منتجاتك بصورها وأسعارها',
                    'أكمل ملفك: الهوية والحساب البنكي وحسابات التواصل',
                    'تراجع الإدارة متجرك وتعتمده، وتظهر منتجاتك في السوق',
                  ].map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="grid w-6 h-6 shrink-0 place-items-center rounded-full bg-action/10 text-xs font-bold text-action">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <a
                  href={vendorConsoleUrl(form.email.trim())}
                  target="_blank"
                  rel="noopener"
                  className="w-full px-5 py-3 rounded-xl bg-action text-white text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  افتح لوحة المورّد
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button type="button" onClick={onClose} className="block mx-auto text-xs font-medium text-slate-500">
                  لاحقاً
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="rounded-xl border border-line bg-paper p-3 text-2xs text-ink-1 leading-relaxed">
                  دقيقة وحدة: سجّل الآن، وبعدها من لوحة المورّد تضيف منتجاتك وتكمل ملفك، وتراجعه إدارة يوصل للاعتماد.
                </p>

                <Field label="اسمك" value={form.name} onChange={(v) => set('name', v)} placeholder="الاسم الأول والعائلة" autoComplete="name" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="اسم المتجر" value={form.projectName} onChange={(v) => set('projectName', v)} autoComplete="organization" />
                  <label className="block text-sm">
                    <span className="text-slate-600 mb-1.5 block font-bold">نوع المشروع</span>
                    <select required className={inputClass} value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
                      <option value="">اختر</option>
                      {PROJECT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {form.projectType === 'أخرى' ? (
                  <Field label="اكتب نوع مشروعك" value={form.projectTypeOther} onChange={(v) => set('projectTypeOther', v)} />
                ) : null}
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="البريد الإلكتروني" type="email" dir="ltr" value={form.email} onChange={(v) => set('email', v)} readOnly={signedIn} autoComplete="email" />
                  <Field label="رقم الجوال (اختياري)" type="tel" dir="ltr" value={form.phone} onChange={(v) => set('phone', v)} readOnly={signedIn} placeholder="05xxxxxxxx" autoComplete="tel" required={false} />
                </div>
                {signedIn ? (
                  <p className="text-2xs text-slate-500">يُفتح المتجر على حسابك الحالي — ادخل لوحة المورّد بنفس رقمك السري.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="text-slate-600 mb-1.5 block font-bold">الرقم السري</span>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => set('password', e.target.value)}
                          className={`${inputClass} pl-12`}
                          autoComplete="new-password"
                          placeholder={`${PASSWORD_MIN_LENGTH} خانات على الأقل`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          aria-label={showPassword ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </label>
                    <Field
                      label="تأكيد الرقم السري"
                      type={showPassword ? 'text' : 'password'}
                      value={form.passwordConfirm}
                      onChange={(v) => set('passwordConfirm', v)}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {error ? (
                  <div role="alert" className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-xl bg-action text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Store className="w-4 h-4" />
                  {loading ? 'جارٍ التسجيل…' : 'افتح متجري'}
                </button>

                {onOpenCourierRegister ? (
                  <button
                    type="button"
                    onClick={onOpenCourierRegister}
                    className="w-full text-xs font-medium text-action hover:underline"
                  >
                    لست مورّداً؟ سجّل كمندوب توصيل
                  </button>
                ) : null}
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
  readOnly,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
  readOnly?: boolean;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 mb-1.5 block font-bold">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
        dir={dir}
        readOnly={readOnly}
        autoComplete={autoComplete}
      />
    </label>
  );
}
