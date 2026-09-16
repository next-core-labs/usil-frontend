import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import type { SessionUser } from '../../LoginScreen';

type EmailVerifyPanelProps = {
  email: string;
  phone: string;
  emailSent: boolean;
  initialCode?: string;
  onVerified: (user: SessionUser) => void;
};

export function EmailVerifyPanel({
  email,
  phone,
  emailSent: initialEmailSent,
  initialCode,
  onVerified,
}: EmailVerifyPanelProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [single, setSingle] = useState(initialCode || '');
  const [useBoxes, setUseBoxes] = useState(!initialCode);
  const [emailSent, setEmailSent] = useState(initialEmailSent);
  const [onceCode, setOnceCode] = useState(initialEmailSent ? '' : initialCode || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (initialCode && !initialEmailSent) {
      setOnceCode(initialCode);
      setSingle(initialCode);
      setUseBoxes(false);
    }
  }, [initialCode, initialEmailSent]);

  const code = useBoxes ? digits.join('') : single.replace(/\D/g, '').slice(0, 6);

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);
    setSuccess(null);
    if (code.length !== 6) {
      setError('أدخل رمز التأكيد المكوّن من 6 أرقام.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, phone, code }),
      });
      const data = await res.json();
      if (!data.success || !data.user) {
        setError(data.error || 'رمز التأكيد غير صحيح.');
        return;
      }
      setSuccess(data.message || 'تم تأكيد بريدك.');
      setOnceCode('');
      onVerified(data.user);
    } catch {
      setError('تعذر تأكيد البريد. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر إعادة إرسال رمز التأكيد.');
        return;
      }
      setEmailSent(Boolean(data.emailSent));
      if (!data.emailSent && data.verificationCode) {
        setOnceCode(String(data.verificationCode));
        setSingle(String(data.verificationCode));
        setUseBoxes(false);
        setSuccess('تعذر إرسال البريد الآن. هذا الرمز يظهر مرة واحدة فقط في هذه الجلسة.');
      } else {
        setOnceCode('');
        setSuccess(data.message || 'أرسلنا رمز تأكيد جديداً إلى بريدك.');
      }
    } catch {
      setError('تعذر إعادة إرسال رمز التأكيد.');
    } finally {
      setResending(false);
    }
  };

  const onBoxChange = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, '');
    if (nextDigit.length > 1) {
      const pasted = nextDigit.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      pasted.forEach((d, i) => {
        next[i] = d;
      });
      setDigits(next);
      if (pasted.length === 6) {
        setTimeout(() => submit(), 0);
      }
      return;
    }
    const next = [...digits];
    next[index] = nextDigit.slice(-1);
    setDigits(next);
    if (nextDigit && index < 5) inputsRef.current[index + 1]?.focus();
    if (index === 5 && nextDigit && next.join('').length === 6) {
      setTimeout(() => submit(), 0);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-right">
      <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs text-slate-600 font-medium leading-relaxed">
        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-action" />
          أدخل رمز التأكيد
        </p>
        {emailSent ? (
          <p>أرسلنا رمزًا إلى بريدك إن كان البريد مفعّلًا على الخادم. الرمز صالح 30 دقيقة.</p>
        ) : (
          <p>البريد غير مفعّل على الخادم الآن، لذلك يظهر الرمز مرة واحدة هنا فقط. انسخه ثم أكّد.</p>
        )}
        <p className="mt-1 text-slate-500" dir="ltr">
          {email}
        </p>
      </div>

      {onceCode ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-3 py-3">
          <p className="text-2xs font-medium text-amber-900 mb-1">رمز التأكيد (مرة واحدة في هذه الجلسة)</p>
          <p className="text-2xl font-mono font-bold tracking-[0.35em] text-navy text-center" dir="ltr">
            {onceCode}
          </p>
        </div>
      ) : null}

      {useBoxes ? (
        <div>
          <label className="block text-center text-xs font-medium text-slate-700 mb-3">رمز التأكيد</label>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2" dir="ltr">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                maxLength={idx === 0 ? 6 : 1}
                value={digit}
                onChange={(e) => onBoxChange(idx, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
                    inputsRef.current[idx - 1]?.focus();
                  }
                }}
                aria-label={`خانة ${idx + 1} من رمز التأكيد`}
                className="w-10 h-12 sm:w-11 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-action focus:outline-none text-slate-900"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setUseBoxes(false)}
            className="mt-2 w-full text-2xs font-medium text-slate-500 hover:text-slate-800"
          >
            أو اكتب الرمز في خانة واحدة
          </button>
        </div>
      ) : (
        <label className="block text-sm">
          <span className="text-slate-600 mb-1.5 block font-bold">رمز التأكيد</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={single}
            onChange={(e) => setSingle(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            dir="ltr"
            className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.4em] text-ink focus:outline-none focus:bg-white focus:border-action"
          />
        </label>
      )}

      {error ? (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-11 bg-action hover:bg-action-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {loading ? 'جارٍ التأكيد…' : 'تأكيد'}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="w-full min-h-11 text-sm font-bold text-action hover:underline disabled:opacity-60 flex items-center justify-center gap-1.5"
      >
        {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
        إعادة إرسال
      </button>
    </form>
  );
}
