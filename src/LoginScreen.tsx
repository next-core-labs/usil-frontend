import React, { useEffect, useState } from 'react';
import { Lock, Mail, Phone, LogIn, AlertCircle, Eye, EyeOff, X, Camera, UserPlus, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { UsilLockup } from './components/UsilLockup';
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

    if (!email.trim() || !phone.trim() || !password) {
      setError('البريد الإلكتروني ورقم الجوال والرقم السري مطلوبة كلها.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('اكتب الاسم لإكمال إنشاء حساب العميل.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('الرقم السري يجب ألا يقل عن 6 خانات.');
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

    if (!email.trim() || !phone.trim()) {
      setError('أدخل البريد الإلكتروني ورقم الجوال معاً كما سجّلتهما.');
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

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          newPassword: password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر استعادة الحساب. حاول مرة أخرى.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
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
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const inputClass =
    'w-full bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-4 py-3 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:bg-white focus:border-[#155EEF]';

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
        ? 'أدخل البريد ورقم الجوال معاً كما سجّلتهما، ثم الرقم السري الجديد.'
        : mode === 'register'
          ? 'سجّل كعميل بالبريد والجوال والرقم السري. يمكنك رفع صورة أو نولّد لك شعاراً باسمك.'
          : 'أدخل البريد والجوال والرقم السري. النظام يحوّلك تلقائيًا إلى واجهة العميل أو المورد أو الإدارة حسب حسابك.';

  return (
    <div dir="rtl" className="min-h-screen bg-[#0A1A33] text-white flex items-center justify-center px-2 py-4 sm:p-4 overflow-x-hidden pattern-navy">
      <div className="w-full max-w-md mx-2 sm:mx-auto relative">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-1 left-0 w-9 h-9 rounded-full bg-white text-[#475467] hover:text-[#101828] flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="text-center mb-7 flex flex-col items-center">
          <UsilLockup variant="inverse" />
          <h1 className="text-2xl font-display font-extrabold text-white mt-5">{title}</h1>
          <p className="text-sm text-white/65 mt-2 leading-relaxed max-w-sm">{subtitle}</p>
        </div>

        {mode === 'verify' ? (
          <div className="bg-white text-[#101828] border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 space-y-4 overflow-x-hidden">
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
          className="bg-white text-[#101828] border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 space-y-4 overflow-x-hidden"
        >
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ${
                  mode === 'register' ? 'bg-[#155EEF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                دخول
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-600 font-medium leading-relaxed">
              يلزم البريد ورقم الجوال معاً ليطابقا حساباً موجوداً. بعدها تضع الرقم السري الجديد.
            </div>
          )}

          {mode === 'register' && (
            <>
              <label className="block text-sm">
                <span className="text-slate-600 mb-1.5 block font-bold">الاسم</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="الاسم الكامل"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 mb-1.5 flex items-center gap-2 font-bold">
                  <Camera className="w-4 h-4 text-[#155EEF]" />
                  صورة الحساب (اختياري)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-xs file:ml-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#0A1A33] file:text-white file:font-bold"
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
                <p className="text-[11px] text-slate-500 mt-1">
                  إن لم ترفع صورة نولّد لك شعاراً باسمك بألوان يوصل. لا نستخدم صوراً تجريبية.
                </p>
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="معاينة الصورة" className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-200" />
                ) : null}
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="text-slate-600 mb-1.5 flex items-center gap-2 font-bold">
              <Mail className="w-4 h-4 text-[#155EEF]" />
              البريد الإلكتروني
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="name@company.sa"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 mb-1.5 flex items-center gap-2 font-bold">
              <Phone className="w-4 h-4 text-[#155EEF]" />
              رقم الجوال
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="05xxxxxxxx"
              autoComplete="tel"
              dir="ltr"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 mb-1.5 flex items-center gap-2 font-bold">
              <Lock className="w-4 h-4 text-[#155EEF]" />
              {mode === 'forgot' ? 'الرقم السري الجديد' : 'الرقم السري'}
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pl-12`}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {mode === 'login' ? (
            <button
              type="button"
              onClick={openForgot}
              className="text-[12px] font-bold text-[#155EEF] hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
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
                className="mt-1 w-5 h-5 shrink-0 rounded border-slate-300 text-[#155EEF] accent-[#155EEF] focus:ring-[#155EEF] focus:ring-offset-0"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800">حفظ البيانات</span>
                <span className="block text-[11px] text-slate-500 leading-relaxed">خلّك داخل على هذا الجهاز</span>
              </span>
            </label>
          ) : null}

          {mode === 'forgot' ? (
            <label className="block text-sm">
              <span className="text-slate-600 mb-1.5 flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-[#155EEF]" />
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
            <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {!email.trim() && !phone.trim() && !password && !error && !successMsg && !loading ? (
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {mode === 'forgot'
                ? 'الحقول فارغة — اكتب البريد والجوال معاً ثم الرقم السري الجديد (8 خانات على الأقل).'
                : 'الحقول فارغة — البريد والجوال والرقم السري مطلوبة كلها.'}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : mode === 'forgot' ? <KeyRound className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading
              ? mode === 'forgot'
                ? 'جارٍ حفظ الرقم السري…'
                : 'جارٍ التحقق…'
              : mode === 'forgot'
                ? 'تغيير الرقم السري'
                : mode === 'login'
                  ? 'دخول'
                  : 'إنشاء حساب عميل'}
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              onClick={openForgot}
              className="w-full text-[12px] font-bold text-[#155EEF] hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          ) : null}

          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              العودة لتسجيل الدخول
            </button>
          ) : null}

          {mode !== 'forgot' && onOpenVendorRegister ? (
            <button
              type="button"
              onClick={onOpenVendorRegister}
              className="w-full text-[11px] text-slate-400 hover:text-slate-600 font-medium"
            >
              مورّد؟ سجّل مشروعك للمراجعة (ثانوي)
            </button>
          ) : null}
          {mode !== 'forgot' && onOpenCourierRegister ? (
            <button
              type="button"
              onClick={onOpenCourierRegister}
              className="w-full text-[11px] text-slate-400 hover:text-slate-600 font-medium"
            >
              سجّل معنا مندوب توصيل
            </button>
          ) : null}
        </form>
        )}

        <p className="mt-5 text-[11px] text-white/50 text-center leading-relaxed">
          حسابك محمي بجلسة آمنة. المورّد الجديد يبقى معلّقًا حتى موافقة إدارة يوصل.
        </p>
      </div>
    </div>
  );
}
