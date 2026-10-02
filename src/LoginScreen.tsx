import React, { useEffect, useState } from 'react';
import { controlClass } from './components/ui/Field';
import { Lock, Mail, Phone, LogIn, AlertCircle, Eye, EyeOff, X, Camera, UserPlus, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { UsilLockup } from './components/UsilLockup';
import { UsilMark } from './components/UsilMark';
import { EmailVerifyPanel } from './components/auth/EmailVerifyPanel';
import type { AccountRole } from './contracts/auth/roles';
export type { AccountRole };

const REMEMBER_FLAG_KEY = 'usil_remember_login';
const REMEMBER_EMAIL_KEY = 'usil_remember_email';

function readRememberedLogin(): { remember: boolean; email: string } {
  try {
    localStorage.removeItem('usil_remember_password');
    localStorage.removeItem('midyaf_remember_password');
    const remember = localStorage.getItem(REMEMBER_FLAG_KEY) === '1';
    const email = remember ? String(localStorage.getItem(REMEMBER_EMAIL_KEY) || '') : '';
    return { remember, email };
  } catch {
    return { remember: false, email: '' };
  }
}

function persistRememberedLogin(remember: boolean, email: string) {
  try {
    localStorage.removeItem('usil_remember_password');
    localStorage.removeItem('midyaf_remember_password');
    if (remember && email.trim()) {
      localStorage.setItem(REMEMBER_FLAG_KEY, '1');
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      return;
    }
    localStorage.removeItem(REMEMBER_FLAG_KEY);
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  } catch {
    /* private / blocked storage */
  }
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
  avatarUrl?: string;
  avatar?: string;
  emailVerified?: boolean;
};

export type AuthSuccessMeta = {
  needsEmailVerification?: boolean;
};

type LoginScreenProps = {
  onSuccess: (user: SessionUser, meta?: AuthSuccessMeta) => void;
  onClose?: () => void;
  onOpenVendorRegister?: () => void;
  onOpenCourierRegister?: () => void;
  defaultMode?: 'login' | 'register' | 'verify';
  verifyPrefill?: { email?: string; phone?: string };
  /** Render as the storefront's white card (no full-screen navy backdrop). */
  embedded?: boolean;
  /** «أو تابع كضيف» under the form, storefront only. */
  guestLabel?: string;
  onContinueAsGuest?: () => void;
};

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      reject(new Error('ارفع صورة jpg أو png أو webp فقط.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('حجم الصورة يجب ألا يتجاوز 2 ميغابايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
    reader.readAsDataURL(file);
  });
}

export function LoginScreen({
  onSuccess,
  onClose,
  onOpenVendorRegister,
  onOpenCourierRegister,
  defaultMode = 'login',
  verifyPrefill,
  embedded = false,
  guestLabel,
  onContinueAsGuest,
}: LoginScreenProps) {
  const remembered = readRememberedLogin();
  const [email, setEmail] = useState(verifyPrefill?.email || remembered.email);
  const [phone, setPhone] = useState(verifyPrefill?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(remembered.remember);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>(
    defaultMode === 'verify' ? 'verify' : defaultMode,
  );
  const [name, setName] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [verifyEmailSent, setVerifyEmailSent] = useState(true);
  const [onceVerifyCode, setOnceVerifyCode] = useState('');
  /* Reset runs in two steps: request a mailed code, then code + new password. */
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetCode, setResetCode] = useState('');
  /* Per-field errors sit next to the field they describe. The single banner
     told the user something was wrong but not which box to fix. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultMode === 'verify') setMode('verify');
  }, [defaultMode]);

  useEffect(() => {
    if (verifyPrefill?.email) setEmail(verifyPrefill.email);
    if (verifyPrefill?.phone) setPhone(verifyPrefill.phone);
  }, [verifyPrefill?.email, verifyPrefill?.phone]);

  const enterVerify = (data: {
    emailSent?: boolean;
    verificationCode?: string;
    user?: SessionUser;
  }) => {
    setVerifyEmailSent(Boolean(data.emailSent));
    setOnceVerifyCode(data.emailSent ? '' : String(data.verificationCode || ''));
    setMode('verify');
    setError(null);
    setSuccessMsg(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const nextFieldErrors: Record<string, string> = {};
    if (!email.trim()) nextFieldErrors.email = 'اكتب بريدك الإلكتروني.';
    if (!phone.trim()) nextFieldErrors.phone = 'اكتب رقم جوالك.';
    if (!password) nextFieldErrors.password = 'اكتب الرقم السري.';
    if (mode === 'register' && !name.trim()) nextFieldErrors.name = 'اكتب اسمك الكامل.';
    if (mode === 'register' && password && password.length < 8) {
      nextFieldErrors.password = 'الرقم السري يجب ألا يقل عن 8 خانات.';
    }
    if (mode === 'register' && confirmPassword && password !== confirmPassword) {
      nextFieldErrors.confirmPassword = 'الرقمان السريان غير متطابقين.';
    }
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      if (!email.trim() || !phone.trim() || !password) {
        setError('البريد الإلكتروني ورقم الجوال والرقم السري مطلوبة كلها.');
      } else if (mode === 'register' && !name.trim()) {
        setError('اكتب الاسم لإكمال إنشاء حساب العميل.');
      } else if (mode === 'register' && password.length < 8) {
        setError('الرقم السري يجب ألا يقل عن 8 خانات.');
      }
      // Move focus to the first offending field so keyboard and screen-reader
      // users are not left hunting for what failed.
      const first = Object.keys(nextFieldErrors)[0];
      document.getElementById(`usil-login-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          password,
          name: name.trim(),
          avatarDataUrl: mode === 'register' ? avatarDataUrl : undefined,
          remember: mode === 'login' ? remember : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.user) {
        setError(data.error || 'تعذر تسجيل الدخول. تحقق من البيانات.');
        return;
      }
      if (mode === 'login') persistRememberedLogin(remember, email);
      const needsVerify = Boolean(data.needsEmailVerification) && data.user.role !== 'admin';
      if (needsVerify) {
        enterVerify(data);
        onSuccess(data.user, { needsEmailVerification: true });
        return;
      }
      onSuccess(data.user);
    } catch {
      setError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('أدخل البريد الإلكتروني الذي سجّلت به.');
      return;
    }
    if (resetStep === 'confirm') {
      if (!/^\d{6}$/.test(resetCode.trim())) {
        setError('أدخل رمز الاستعادة المكوّن من 6 أرقام.');
        return;
      }
      if (!password || password.length < 8) {
        setError('الرقم السري ضعيف. استخدم 8 خانات على الأقل.');
        return;
      }
      if (password !== confirmPassword) {
        setError('الرقم السري وتأكيده غير متطابقين.');
        return;
      }
    }

    setLoading(true);
    try {
      const requesting = resetStep === 'request';
      const res = await fetch(requesting ? '/api/auth/forgot-password' : '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          requesting
            ? { email: email.trim() }
            : { email: email.trim(), code: resetCode.trim(), newPassword: password },
        ),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر استعادة الحساب. حاول مرة أخرى.');
        return;
      }
      if (requesting) {
        // Local runs without SMTP hand the code back once; production never does.
        setResetCode(data.resetCode ? String(data.resetCode) : '');
        setResetStep('confirm');
        setSuccessMsg(data.message || 'إن كان البريد مسجّلاً فسيصلك رمز الاستعادة.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setResetStep('request');
      setMode('login');
      setSuccessMsg(data.message || 'تم تغيير الرقم السري. ادخل الآن.');
    } catch {
      setError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setMode('forgot');
    setResetStep('request');
    setResetCode('');
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const fieldError = (key: string) =>
    fieldErrors[key] ? (
      <p
        id={`usil-login-${key}-error`}
        role="alert"
        className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
        {fieldErrors[key]}
      </p>
    ) : null;

  const req = (
    <span className="text-danger" aria-hidden>
      *
    </span>
  );

  const inputClass = embedded
    ? 'w-full h-[50px] px-3.5 rounded-xl border border-navy-300 bg-surface text-[16px] text-navy outline-none transition-colors placeholder:text-muted focus:border-action focus:ring-4 focus:ring-action/10'
    : controlClass;
  const labelClass = 'text-[13px] font-semibold text-navy mb-1.5 flex items-center gap-2';

  const title =
    mode === 'verify'
      ? 'تأكيد البريد الإلكتروني'
      : mode === 'forgot'
        ? 'استعادة الحساب'
        : mode === 'register'
          ? 'إنشاء حساب عميل'
          : 'تسجيل الدخول إلى يوصل';
  const subtitle =
    mode === 'verify'
      ? 'أدخل رمز التأكيد. إن وُجد بريد على الخادم يصلك الرمز هناك، وإلا يظهر مرة واحدة هنا.'
      : mode === 'forgot'
        ? resetStep === 'request'
          ? 'أدخل بريدك المسجّل ونرسل إليه رمز استعادة من 6 أرقام.'
          : 'أدخل الرمز الذي وصلك على بريدك، ثم الرقم السري الجديد.'
        : mode === 'register'
          ? 'سجّل كعميل بالبريد والجوال والرقم السري. يمكنك رفع صورة أو نولّد لك شعاراً باسمك.'
          : 'أدخل البريد والجوال والرقم السري. النظام يحوّلك تلقائيًا إلى واجهة العميل أو المورد أو الإدارة حسب حسابك.';

  const body = (
    <>
        {mode === 'verify' ? (
          <div className={embedded ? 'space-y-4' : 'bg-white text-ink border border-line rounded-2xl p-5 sm:p-6 space-y-4 overflow-x-hidden'}>
            <EmailVerifyPanel
              email={email.trim()}
              phone={phone.trim()}
              emailSent={verifyEmailSent}
              initialCode={onceVerifyCode || undefined}
              onVerified={(user) => onSuccess(user)}
            />
          </div>
        ) : (
        <form
          onSubmit={mode === 'forgot' ? submitForgot : submit}
          className={embedded ? 'space-y-4' : 'bg-white text-ink border border-line rounded-2xl p-5 sm:p-6 space-y-4 overflow-x-hidden'}
        >
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-paper border border-line rounded-xl mb-1">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`h-10 rounded-[9px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'register' ? 'bg-action text-white' : 'text-ink-1 hover:text-navy'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                إنشاء حساب عميل
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`h-10 rounded-[9px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login' ? 'bg-navy text-white' : 'text-ink-1 hover:text-navy'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                دخول
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-paper border border-line px-3 py-2.5 text-xs text-ink-1 font-medium leading-relaxed">
              {resetStep === 'request'
                ? 'نرسل رمز الاستعادة إلى بريدك المسجّل. الرمز صالح لمدة 15 دقيقة.'
                : 'الرمز صالح لمدة 15 دقيقة، وبعد 5 محاولات خاطئة يلزم طلب رمز جديد.'}
            </div>
          )}

          {mode === 'register' && (
            <>
              <label className="block text-sm">
                <span className={labelClass}>الاسم {req}</span>
                <input
                  id="usil-login-name"
                  value={name}
                  onChange={(e) => {
                setName(e.target.value);
                clearFieldError('name');
              }}
                  className={`${inputClass} ${fieldErrors.name ? 'border-danger bg-danger-bg' : ''}`}
                  placeholder="الاسم الكامل"
                  required
                  aria-invalid={fieldErrors.name ? true : undefined}
                  aria-describedby={fieldErrors.name ? 'usil-login-name-error' : undefined}
                />
                {fieldError('name')}
              </label>
              <label className="block text-sm">
                <span className={labelClass}>
                  <Camera className="w-4 h-4 text-action" />
                  صورة الحساب (اختياري)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl border border-dashed border-navy-300 bg-paper text-xs text-ink-1 cursor-pointer file:me-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy file:text-white file:text-xs file:font-semibold"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setAvatarDataUrl('');
                      return;
                    }
                    try {
                      setAvatarDataUrl(await readImageFile(file));
                      setError(null);
                    } catch (err) {
                      setAvatarDataUrl('');
                      setError(err instanceof Error ? err.message : 'تعذر رفع الصورة');
                    }
                  }}
                />
                <p className="text-2xs text-ink-3 mt-1.5 leading-relaxed">
                  إن لم ترفع صورة نولّد لك شعاراً باسمك بألوان يوصل. لا نستخدم صوراً تجريبية.
                </p>
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="معاينة الصورة" className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-200" />
                ) : null}
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className={labelClass}>
              <Mail className="w-4 h-4 text-action" />
              البريد الإلكتروني {req}
            </span>
            <input
              id="usil-login-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              className={`${inputClass} ${fieldErrors.email ? 'border-danger bg-danger-bg' : ''}`}
              placeholder="name@company.sa"
              autoComplete="email"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'usil-login-email-error' : undefined}
            />
            {fieldError('email')}
          </label>

          {mode === 'forgot' && resetStep === 'confirm' ? (
            <label className="block text-sm">
              <span className={labelClass}>
                <KeyRound className="w-4 h-4 text-action" />
                رمز الاستعادة {req}
              </span>
              <input
                id="usil-login-reset-code"
                inputMode="numeric"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${inputClass} font-mono tracking-widest`}
                placeholder="000000"
                autoComplete="one-time-code"
                dir="ltr"
              />
            </label>
          ) : null}

          {mode !== 'forgot' ? (
          <label className="block text-sm">
            <span className={labelClass}>
              <Phone className="w-4 h-4 text-action" />
              رقم الجوال {req}
            </span>
            <input
              id="usil-login-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError('phone');
              }}
              className={`${inputClass} font-mono ${fieldErrors.phone ? 'border-danger bg-danger-bg' : ''}`}
              placeholder="05xxxxxxxx"
              autoComplete="tel"
              dir="ltr"
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? 'usil-login-phone-error' : undefined}
            />
            {fieldError('phone')}
          </label>
          ) : null}

          {mode !== 'forgot' || resetStep === 'confirm' ? (
          <label className="block text-sm">
            <span className={labelClass}>
              <Lock className="w-4 h-4 text-action" />
              {mode === 'forgot' ? 'الرقم السري الجديد' : 'الرقم السري'} {req}
            </span>
            <div className="relative">
              <input
                id="usil-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'usil-login-password-error' : undefined}
                className={`${inputClass} pl-12 ${fieldErrors.password ? 'border-danger bg-danger-bg' : ''}`}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-navy min-h-0"
                aria-label={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldError('password')}
          </label>
          ) : null}

          {mode === 'login' ? (
            <label className="flex items-start gap-3 min-h-11 py-1 cursor-pointer select-none">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(e) => {
                  const next = e.target.checked;
                  setRemember(next);
                  if (!next) persistRememberedLogin(false, '');
                }}
                className="mt-1 w-5 h-5 shrink-0 rounded border-navy-300 accent-action"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-navy">حفظ البيانات</span>
                <span className="block text-2xs text-ink-3 leading-relaxed">خلّك داخل على هذا الجهاز</span>
              </span>
            </label>
          ) : null}

          {mode === 'forgot' && resetStep === 'confirm' ? (
            <label className="block text-sm">
              <span className={labelClass}>
                <Lock className="w-4 h-4 text-action" />
                تأكيد الرقم السري
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
          ) : null}

          {successMsg ? (
            <div className="flex items-start gap-2 text-xs text-success bg-success-bg border border-success-border rounded-xl p-3">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 text-xs text-danger bg-danger-bg border border-danger-border rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {mode === 'forgot'
            ? !email.trim() && !error && !successMsg && !loading ? (
                <p className="text-2xs text-ink-3 leading-relaxed">
                  الحقل فارغ — اكتب بريدك المسجّل لنرسل إليه رمز الاستعادة.
                </p>
              ) : null
            : !email.trim() && !phone.trim() && !password && !error && !successMsg && !loading ? (
                <p className="text-2xs text-ink-3 leading-relaxed">
                  الحقول فارغة — البريد والجوال والرقم السري مطلوبة كلها.
                </p>
              ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-action hover:bg-action-hover active:bg-action-pressed disabled:opacity-60 text-white font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : mode === 'forgot' ? <KeyRound className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading
              ? mode === 'forgot'
                ? resetStep === 'request'
                  ? 'جارٍ إرسال الرمز…'
                  : 'جارٍ حفظ الرقم السري…'
                : 'جارٍ التحقق…'
              : mode === 'forgot'
                ? resetStep === 'request'
                  ? 'أرسل رمز الاستعادة'
                  : 'تغيير الرقم السري'
                : mode === 'login'
                  ? 'دخول'
                  : 'إنشاء حساب عميل'}
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              onClick={openForgot}
              className="w-full min-h-0 text-[13px] font-semibold text-action hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          ) : null}

          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setResetStep('request');
                setResetCode('');
                setError(null);
                setSuccessMsg(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full min-h-0 text-[13px] font-medium text-ink-3 hover:text-navy flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              العودة لتسجيل الدخول
            </button>
          ) : null}

          {mode !== 'forgot' && (onOpenVendorRegister || onOpenCourierRegister) ? (
            <div className="pt-3 mt-1 border-t border-line-soft grid gap-2">
              {onOpenVendorRegister ? (
                <button
                  type="button"
                  onClick={onOpenVendorRegister}
                  className="w-full h-11 px-3.5 rounded-xl border border-line bg-paper text-navy text-[13px] font-semibold flex items-center justify-between gap-2 transition-colors hover:border-action hover:text-action"
                >
                  <span>مورّد؟ سجّل مشروعك للمراجعة</span>
                  <ArrowRight className="w-4 h-4 rotate-180 shrink-0" aria-hidden />
                </button>
              ) : null}
              {onOpenCourierRegister ? (
                <button
                  type="button"
                  onClick={onOpenCourierRegister}
                  className="w-full h-11 px-3.5 rounded-xl border border-line bg-paper text-navy text-[13px] font-semibold flex items-center justify-between gap-2 transition-colors hover:border-action hover:text-action"
                >
                  <span>سجّل معنا مندوب توصيل</span>
                  <ArrowRight className="w-4 h-4 rotate-180 shrink-0" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </form>
        )}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full max-w-[440px] bg-surface text-ink border border-line rounded-[20px] p-[clamp(24px,4vw,36px)]">
        <UsilMark className="w-12 h-12" />
        <h1 className="mt-5 mb-2 text-[28px] font-bold tracking-[-0.03em] text-navy">{title}</h1>
        <p className="mb-[22px] text-sm leading-[1.7] text-ink-1">{subtitle}</p>
        {body}
        {onContinueAsGuest && mode !== 'verify' ? (
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="block w-full text-center mt-4 text-[13px] text-ink-3 hover:text-action min-h-0"
          >
            {guestLabel || 'أو تابع كضيف'}
          </button>
        ) : null}
        <p className="mt-5 text-2xs text-ink-3 text-center leading-relaxed">
          حسابك محمي بجلسة آمنة. المورّد الجديد يبقى معلّقًا حتى موافقة إدارة يوصل.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-navy text-white flex items-center justify-center px-2 py-4 sm:p-4 overflow-x-hidden pattern-navy">
      <div className="w-full max-w-md mx-2 sm:mx-auto relative">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-1 left-0 w-9 h-9 rounded-full bg-white text-ink-2 hover:text-ink flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="text-center mb-7 flex flex-col items-center">
          <UsilLockup variant="inverse" />
          <h1 className="text-2xl font-display font-bold text-white mt-5">{title}</h1>
          <p className="text-sm text-white/65 mt-2 leading-relaxed max-w-sm">{subtitle}</p>
        </div>

        {body}

        <p className="mt-5 text-2xs text-white/50 text-center leading-relaxed">
          حسابك محمي بجلسة آمنة. المورّد الجديد يبقى معلّقًا حتى موافقة إدارة يوصل.
        </p>
      </div>
    </div>
  );
}
