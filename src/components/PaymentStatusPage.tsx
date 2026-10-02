import React, { useEffect, useState } from 'react';
import { Check, XCircle, Loader2 } from 'lucide-react';
import { useLang } from '../storefront/lang';
import { money } from '../storefront/money';

type PayState = 'loading' | 'paid' | 'failed';

/**
 * Checkout step 3 (confirmation) from the design, driven by Moyasar's verified
 * payment record: `/payment/success?id=<moyasar id>`.
 */
export function PaymentSuccessPage({ onBack, onOrders }: { onBack: () => void; onOrders?: () => void }) {
  const { t, ar } = useLang();
  const [state, setState] = useState<PayState>('loading');
  const [amount, setAmount] = useState<number | null>(null);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')?.trim() || '';
    if (!id) {
      setState('failed');
      setError(t.payNoId);
      return;
    }
    void fetch(`/api/payments/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          amount?: number;
          error?: string;
          bookingId?: string;
          metadata?: { order_id?: string; bookingId?: string };
        };
        if (!res.ok) throw new Error(data.error || t.payFailedSub);
        setAmount(typeof data.amount === 'number' ? data.amount : null);
        setOrderId(String(data.bookingId || data.metadata?.bookingId || data.metadata?.order_id || ''));
        const paid = String(data.status || '').toLowerCase() === 'paid';
        setState(paid ? 'paid' : 'failed');
        if (!paid) setError(t.payFailedSub);
      })
      .catch((err: Error) => {
        setState('failed');
        setError(err.message || t.payFailedSub);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-[720px] mx-auto px-[clamp(16px,4vw,40px)] pt-10 pb-16">
      <div className="bg-surface border border-line rounded-card p-[clamp(24px,4vw,40px)] text-center">
        {state === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-action" aria-hidden />
            <p className="text-sm font-semibold text-ink-1">{t.payChecking}</p>
          </div>
        ) : state === 'paid' ? (
          <>
            <span className="inline-grid place-items-center w-[72px] h-[72px] rounded-panel bg-action text-white" style={{ animation: 'lm-wiggle 1.2s ease-in-out' }}>
              <Check className="w-[34px] h-[34px]" aria-hidden />
            </span>
            <h1 className="mt-5 mb-2 text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em]">{t.doneTitle}</h1>
            <p className="mx-auto max-w-[420px] text-[15px] leading-[1.7] text-ink-1">{t.doneSub}</p>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-[18px] px-4 py-2.5 rounded-control bg-paper text-sm">
              {orderId ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-ink-3">{t.orderNo}</span>
                  <span dir="ltr" className="font-bold tnum">
                    {orderId}
                  </span>
                </span>
              ) : null}
              {amount != null ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-ink-3">{t.doneAmount}</span>
                  <span className="font-bold tnum">{money(amount, ar)}</span>
                </span>
              ) : null}
            </div>
            <div className="flex gap-2.5 justify-center mt-[22px] flex-wrap">
              <button type="button" onClick={onOrders || onBack} className="h-12 px-[22px] rounded-xl bg-navy text-white text-[15px] font-semibold">
                {t.trackOrder}
              </button>
              <button type="button" onClick={onBack} className="h-12 px-[22px] rounded-xl border border-navy-300 bg-surface text-navy text-[15px] font-semibold">
                {t.backHome}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="inline-grid place-items-center w-[72px] h-[72px] rounded-panel bg-danger-bg text-danger">
              <XCircle className="w-[34px] h-[34px]" aria-hidden />
            </span>
            <h1 className="mt-5 mb-2 text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em]">{t.payFailedTitle}</h1>
            <p className="mx-auto max-w-[420px] text-[15px] leading-[1.7] text-ink-1">{error || t.payFailedSub}</p>
            <div className="flex gap-2.5 justify-center mt-[22px] flex-wrap">
              <button type="button" onClick={onBack} className="h-12 px-[22px] rounded-xl bg-action text-white text-[15px] font-semibold">
                {t.backHome}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export function PaymentCancelledPage({ onBack, onCart }: { onBack: () => void; onCart?: () => void }) {
  const { t } = useLang();
  return (
    <main className="max-w-[720px] mx-auto px-[clamp(16px,4vw,40px)] pt-10 pb-16">
      <div className="bg-surface border border-line rounded-card p-[clamp(24px,4vw,40px)] text-center">
        <span className="inline-grid place-items-center w-[72px] h-[72px] rounded-panel bg-tint-slate text-ink-3">
          <XCircle className="w-[34px] h-[34px]" aria-hidden />
        </span>
        <h1 className="mt-5 mb-2 text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em]">{t.payCancelledTitle}</h1>
        <p className="mx-auto max-w-[420px] text-[15px] leading-[1.7] text-ink-1">{t.payCancelledSub}</p>
        <div className="flex gap-2.5 justify-center mt-[22px] flex-wrap">
          <button type="button" onClick={onCart || onBack} className="h-12 px-[22px] rounded-xl bg-navy text-white text-[15px] font-semibold">
            {t.backToCart}
          </button>
          <button type="button" onClick={onBack} className="h-12 px-[22px] rounded-xl border border-navy-300 bg-surface text-navy text-[15px] font-semibold">
            {t.backHome}
          </button>
        </div>
      </div>
    </main>
  );
}
