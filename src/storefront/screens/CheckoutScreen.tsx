import React, { useEffect, useMemo, useState } from 'react';
import { Check, CreditCard, Wallet, Smartphone, MapPin } from 'lucide-react';
import { PlaceSearchSelect } from '../../components/PlaceSearchSelect';
import { saveDraftBookingForm, loadDraftBookingForm } from '../../utils/storage';
import { hasCheckoutPrice } from '../../utils/catalogMedia';
import { normalizeSaudiMobile } from '../../contracts/shared/booking-guards';
import { ALL_CITIES_LABEL } from '../../data/saudiPlaces';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money, vatInside } from '../money';
import { ArrowIcon } from '../primitives';
import { productPhoto } from '../ProductCard';
import { riyadhToday } from '../../utils/riyadhDate';
import { isMoyasarUrl, savePendingPayment } from '../../utils/pendingPayment';

const PENDING_APPROVAL = 'بانتظار موافقة المورّد';

/** `YYYY-MM-DD` plus `days`, on the calendar (no timezone drift). */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const inputCls =
  'h-[46px] px-3.5 rounded-control border border-navy-300 bg-surface text-[15px] text-navy outline-none focus:border-action focus:ring-4 focus:ring-action/10 w-full';

/**
 * Two live steps (event details → payment method) then a hand-off to Moyasar's
 * hosted page. The third step, confirmation, is `/payment/success`.
 */
export function CheckoutScreen() {
  const { t, ar } = useLang();
  const sf = useStorefront();
  const items = sf.cart;
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(sf.selectedCity && sf.selectedCity !== ALL_CITIES_LABEL ? sf.selectedCity : 'الرياض');
  // Event dates are Saudi calendar days: "today" is today in Riyadh, whatever the device clock zone.
  const minDate = riyadhToday();
  const [date, setDate] = useState(() => {
    const picked = items.find((c) => c.date && c.date >= minDate)?.date;
    return picked || addDays(minDate, 2);
  });
  const [time, setTime] = useState(() => items.find((c) => c.time)?.time || '');
  const [notes, setNotes] = useState(() => items.map((c) => c.customNotes).filter(Boolean).join('\n'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sf.user) {
      setName((n) => n || sf.user?.name || '');
      setPhone((p) => p || sf.user?.phone || '');
    }
  }, [sf.user]);

  useEffect(() => {
    void loadDraftBookingForm().then((draft) => {
      if (!draft) return;
      if (draft.customerName) setName((n) => n || draft.customerName);
      if (draft.customerPhone) setPhone((p) => p || draft.customerPhone);
      if (draft.eventCity) setCity(draft.eventCity);
      if (draft.generalNotes) setNotes(draft.generalNotes);
      // Coming back from the sign-in detour must keep the date the shopper picked.
      if (draft.eventDate && draft.eventDate >= riyadhToday()) setDate(draft.eventDate);
    });
  }, []);

  useEffect(() => {
    void saveDraftBookingForm({ customerName: name, customerPhone: phone, eventDate: date, eventCity: city, generalNotes: notes, paymentMethod: 'moyasar' });
  }, [name, phone, date, city, notes]);

  const total = useMemo(() => items.reduce((sum, c) => sum + (hasCheckoutPrice(c.service.price) ? c.service.price * c.quantity : 0), 0), [items]);
  const approval = items.some((c) => c.service.bookingMode === 'approval');
  const isEmpty = sf.cartReady && items.length === 0;

  // Wait for the saved cart before deciding it is empty, so a refresh on /checkout stays here.
  useEffect(() => {
    if (isEmpty) sf.navigate('/cart', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty]);

  if (!sf.cartReady || items.length === 0) return null;

  const steps = [t.step1, t.step2, t.step3];
  // Moyasar's hosted page offers every method; the shopper picks there, so this is information only.
  const payments = [
    { id: 'mada', label: t.payMada, Icon: CreditCard },
    { id: 'applepay', label: t.payApple, Icon: Wallet },
    { id: 'creditcard', label: t.payCard, Icon: CreditCard },
    { id: 'stcpay', label: t.payStc, Icon: Smartphone },
  ];

  const next = () => {
    const saudi = normalizeSaudiMobile(phone);
    if (!name.trim() || !saudi) {
      setError(t.coErrName);
      return;
    }
    if (!date || date < riyadhToday()) {
      setError(t.coErrDate);
      return;
    }
    setError(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toLogin = () => sf.navigate(`/login?next=${encodeURIComponent('/checkout')}`);

  const placeOrder = async () => {
    const saudi = normalizeSaudiMobile(phone);
    if (!name.trim() || !saudi) {
      setError(t.coErrName);
      setStep(0);
      return;
    }
    // Approval orders are paid later from «طلباتي», so they need an account.
    if (approval && !sf.user) {
      toLogin();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: saudi,
          email: sf.user?.email || undefined,
          serviceId: items[0]?.service.id,
          serviceName: items.map((c) => c.service.title).join(' + '),
          notes,
          city,
          eventDate: date,
          ...(time ? { eventTime: time } : {}),
          paymentMethod: 'moyasar',
          totalAmount: total,
          items: items.map((c) => ({ id: c.service.id, title: c.service.title, quantity: c.quantity, price: c.service.price })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        awaitingApproval?: boolean;
        booking?: { id?: string; paymentUrl?: string; status?: string; awaitingApproval?: boolean };
      };
      const sentToVendor =
        data.awaitingApproval || data.booking?.awaitingApproval || data.booking?.status === PENDING_APPROVAL;
      // Sent to the vendor; nothing to pay until they approve. A repeat tap on the same
      // order lands here too (the server answers with the order it already has).
      if (data.booking?.id && sentToVendor) {
        sf.clearCart();
        sf.navigate(`/orders?sent=${encodeURIComponent(String(data.booking.id))}`);
        return;
      }
      const payUrl = String(data.booking?.paymentUrl || '');
      // The cart stays until Moyasar confirms the payment (/payment/success), so backing
      // out of the payment page leaves the shopper where they were — with a resume link.
      if (payUrl && isMoyasarUrl(payUrl)) {
        savePendingPayment(String(data.booking?.id || ''), payUrl);
        window.location.assign(payUrl);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error || t.coErrNet);
        return;
      }
      if (payUrl) {
        setError(t.coErrPayUrl);
        return;
      }
      const orderId = String(data.booking?.id || '');
      const inv = await fetch('/api/payments/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: total,
          description: `${ar ? 'طلب يوصل' : 'Usil order'} ${orderId} — ${items.map((c) => c.service.title).join(' + ')}`,
          metadata: { order_id: orderId, bookingId: orderId },
        }),
      });
      const invData = (await inv.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!inv.ok) {
        setError(invData.error || t.coErrNet);
        return;
      }
      const url = String(invData.url || '');
      if (!isMoyasarUrl(url)) {
        setError(t.coErrPayUrl);
        return;
      }
      savePendingPayment(orderId, url);
      window.location.assign(url);
    } catch {
      setError(t.coErrNet);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      <h1 className="mb-[22px] text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.coTitle}</h1>

      <ol className="flex items-center gap-2 mb-7 overflow-x-auto scrollbar-none" aria-label={t.coTitle}>
        {steps.map((label, i) => {
          const done = i < step;
          const cur = i === step;
          return (
            <li key={label} className="flex items-center gap-2 flex-none">
              <span
                className={cn(
                  'w-[30px] h-[30px] rounded-full grid place-items-center text-[13px] font-bold border-[1.5px] tnum',
                  i <= step ? 'bg-action text-white border-action' : 'bg-surface text-ink-3 border-navy-300',
                )}
                aria-current={cur ? 'step' : undefined}
              >
                {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn('text-sm font-semibold whitespace-nowrap', cur ? 'text-navy' : 'text-ink-3')}>{label}</span>
              {i < steps.length - 1 ? <span className="w-8 h-px bg-navy-300 mx-1" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="bg-surface border border-line rounded-card p-[clamp(18px,3vw,28px)]">
          {step === 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.fName}
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" required />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.fPhone}
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="05XXXXXXXX"
                    className={cn(inputCls, 'text-start tnum')}
                    required
                  />
                </label>
                <div className="col-span-full flex flex-col gap-1.5 text-[13px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-action" aria-hidden />
                    {t.fAddress}
                  </span>
                  <PlaceSearchSelect value={city} onChange={setCity} includeAll={false} boxed aria-label={t.fAddress} />
                </div>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.fDate}
                  <input type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.time}
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(inputCls, 'tnum')} />
                </label>
                <label className="col-span-full flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.fNotes}
                  <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, 'h-auto py-3 resize-y')} />
                </label>
              </div>
              {error ? (
                <p role="alert" className="mt-4 text-sm text-danger font-medium">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={next}
                className="mt-5 h-[50px] px-[26px] rounded-xl bg-navy text-white text-[15px] font-semibold inline-flex items-center gap-2 hover:bg-navy-800"
              >
                {t.next}
                <ArrowIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="text-[17px] font-bold mb-1">{t.payTitle}</div>
              <p className="text-[13px] text-ink-3 mb-3.5">{t.paySub}</p>
              <ul className="grid grid-cols-2 gap-2.5" aria-label={t.payTitle}>
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 h-14 px-4 rounded-xl border border-line bg-surface text-navy text-[15px] font-medium"
                  >
                    <p.Icon className="w-5 h-5 text-action shrink-0" aria-hidden />
                    {p.label}
                  </li>
                ))}
              </ul>
              <p className={cn('mt-4 p-3 rounded-control text-xs font-semibold leading-relaxed', approval ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success')}>
                {approval ? t.coApproval : t.coInstant}
              </p>
              {approval && !sf.user ? <p className="mt-2 text-xs text-ink-1 leading-relaxed">{t.coApprovalLogin}</p> : null}
              {error ? (
                <p role="alert" className="mt-3 text-sm text-danger font-medium">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2.5 mt-5 flex-wrap">
                <button type="button" onClick={() => setStep(0)} className="h-[50px] px-5 rounded-xl border border-navy-300 bg-surface text-navy text-[15px] font-semibold">
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => void placeOrder()}
                  disabled={busy}
                  className="h-[50px] px-[26px] rounded-xl bg-action text-white text-[15px] font-bold inline-flex items-center gap-2 disabled:opacity-70 hover:bg-action-hover"
                >
                  {busy ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                      {t.placing}
                    </>
                  ) : (
                    <>
                      {approval ? (sf.user ? t.placeRequest : t.signInToSend) : t.placeOrder} · <span className="tnum">{money(total, ar)}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="md:sticky md:top-[84px] bg-surface border border-line rounded-card p-[22px]">
          <div className="flex flex-col gap-3">
            {items.map((c) => (
              <div key={c.service.id} className="flex items-center gap-3">
                <span className="w-[52px] h-[52px] rounded-control overflow-hidden bg-paper shrink-0">
                  {productPhoto(c.service) ? <img src={productPhoto(c.service)} alt="" className="w-full h-full object-cover block" /> : null}
                </span>
                <span className="flex-1 min-w-0 text-[13px] font-semibold leading-[1.4] line-clamp-2">{c.service.title}</span>
                <span className="text-[13px] text-ink-3 tnum">×{c.quantity}</span>
                <span className="text-sm font-bold whitespace-nowrap tnum">{money(c.service.price * c.quantity, ar)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-ink-1 mt-4 pt-3.5 border-t border-line">
            <span>{t.subtotal}</span>
            <span className="tnum">{money(total, ar)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-1 mt-2">
            <span>{t.vat}</span>
            <span className="tnum">{money(vatInside(total), ar)}</span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3.5 border-t border-dashed border-navy-300">
            <span className="text-[15px] font-semibold">{t.total}</span>
            <span className="text-[22px] font-bold tnum">{money(total, ar)}</span>
          </div>
          <div className="text-xs font-medium text-success mt-1">{t.vatIncluded}</div>
        </aside>
      </div>
    </main>
  );
}
