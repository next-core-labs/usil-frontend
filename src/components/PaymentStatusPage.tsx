import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type PayState = 'loading' | 'paid' | 'failed' | 'cancelled';

export function PaymentSuccessPage({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<PayState>('loading');
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')?.trim() || '';
    if (!id) {
      setState('failed');
      setError('ما وصل رقم العملية من ميسر.');
      return;
    }
    void fetch(`/api/payments/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          amount?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || 'تعذر التحقق من الدفع.');
        setAmount(typeof data.amount === 'number' ? data.amount : null);
        setState(String(data.status || '').toLowerCase() === 'paid' ? 'paid' : 'failed');
        if (String(data.status || '').toLowerCase() !== 'paid') {
          setError('العملية ما اكتملت. تقدر تعيد المحاولة من السلة.');
        }
      })
      .catch((err: Error) => {
        setState('failed');
        setError(err.message || 'تعذر التحقق من الدفع.');
      });
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-16 max-w-lg text-right" dir="rtl">
      {state === 'loading' ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#155EEF]" />
          <p className="text-sm font-bold text-slate-700">نتحقق من الدفع مع ميسر…</p>
        </div>
      ) : state === 'paid' ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-black text-[#0A1A33]">تم الدفع</h1>
          <p className="text-sm text-slate-600">
            ميسر أكّد الحالة paid
            {amount != null ? ` بمبلغ ${amount.toLocaleString('ar-SA')} ر.س` : ''}.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-11 rounded-xl bg-[#0A1A33] text-white font-bold"
          >
            العودة للمتجر
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <XCircle className="w-14 h-14 text-rose-600 mx-auto" />
          <h1 className="text-2xl font-black text-[#0A1A33]">ما اكتمل الدفع</h1>
          <p className="text-sm text-slate-600">{error || 'أعد المحاولة من سلة الحجز.'}</p>
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-11 rounded-xl bg-[#155EEF] text-white font-bold"
          >
            إعادة المحاولة من المتجر
          </button>
        </div>
      )}
    </article>
  );
}

export function PaymentCancelledPage({ onBack }: { onBack: () => void }) {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-16 max-w-lg text-right" dir="rtl">
      <div className="space-y-4 text-center">
        <XCircle className="w-14 h-14 text-slate-400 mx-auto" />
        <h1 className="text-2xl font-black text-[#0A1A33]">أُلغيت العملية</h1>
        <p className="text-sm text-slate-600">ما خصمنا شيئاً. تقدر ترجع للحجز وتدفع إلكترونياً متى ما جاهز.</p>
        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-11 rounded-xl bg-[#0A1A33] text-white font-bold"
        >
          الرجوع للمتجر
        </button>
      </div>
    </article>
  );
}
