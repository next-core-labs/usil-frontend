import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, MessageCircle, Star, MapPin, Calendar } from 'lucide-react';
import { customerRefundPercent } from '../../contracts/shared/refund-policy';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money } from '../money';
import { Reveal, StepRail } from '../primitives';
import { productPhoto } from '../ProductCard';
import { fill } from '../copy';

/** A platform order as `GET /api/bookings` returns it to its client. */
export type MyOrder = {
  id: string;
  serviceId?: string;
  serviceName: string;
  eventDate: string;
  city?: string;
  totalAmount: number;
  status: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentUrl?: string;
  bookingMode?: 'instant' | 'approval';
  createdAt?: string;
  items?: Array<{ id: string; title: string; quantity: number; price: number; vendorId?: string }>;
  vendorIds?: string[];
  cancellation?: { note: string; refundPercent: number };
};

const FINAL = new Set(['ملغي', 'مرفوض من المورّد', 'مكتمل']);
const NOT_CANCELLABLE = new Set(['ملغي', 'مرفوض من المورّد', 'مكتمل', 'قيد التنفيذ']);

/** Map the server's Arabic statuses onto the design's four-step rail. */
function stepOf(status: string): number {
  if (status === 'مكتمل') return 3;
  if (status === 'قيد التنفيذ') return 2;
  if (status === 'مؤكد') return 1;
  return 0;
}

function isMoyasarUrl(url?: string): boolean {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase();
    return host === 'moyasar.com' || host.endsWith('.moyasar.com');
  } catch {
    return false;
  }
}

export function OrdersScreen() {
  const { t, ar, L } = useLang();
  const sf = useStorefront();
  const [tab, setTab] = useState<0 | 1>(0);
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(() => {
    if (!sf.user) return;
    setStatus('loading');
    fetch('/api/bookings', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.error || 'failed');
        setOrders(Array.isArray(data.data) ? (data.data as MyOrder[]) : []);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [sf.user]);

  useEffect(load, [load]);

  const statusLabel = (s: string) => {
    if (!ar) {
      const map: Record<string, string> = {
        'جديد': 'New',
        'بانتظار موافقة المورّد': 'Awaiting vendor approval',
        'مؤكد': 'Confirmed',
        'قيد التنفيذ': 'In progress',
        'مكتمل': 'Completed',
        'ملغي': 'Cancelled',
        'مرفوض من المورّد': 'Rejected by vendor',
      };
      return map[s] || s;
    }
    return s;
  };
  const statusTone = (s: string) => {
    if (s === 'ملغي' || s === 'مرفوض من المورّد') return 'bg-danger-bg text-danger';
    if (s === 'مكتمل') return 'bg-success-bg text-success';
    if (s === 'مؤكد') return 'bg-tint-blue text-action';
    if (s === 'قيد التنفيذ') return 'bg-tint-slate text-navy';
    return 'bg-warning-bg text-warning';
  };

  const list = useMemo(() => {
    const rows = orders || [];
    const past = (o: MyOrder) => FINAL.has(o.status);
    return rows.filter((o) => (tab === 0 ? !past(o) : past(o)));
  }, [orders, tab]);

  const vendorOf = (o: MyOrder) => {
    const vendorId = o.vendorIds?.[0] || o.items?.find((i) => i.vendorId)?.vendorId;
    if (!vendorId) return null;
    const listing = sf.services.find((s) => String(s.provider?.id) === vendorId);
    return { vendorId, vendorName: listing?.provider?.name || L('المورّد', 'Provider') };
  };
  const listingOf = (o: MyOrder) => sf.services.find((s) => s.id === String(o.serviceId || o.items?.[0]?.id || ''));

  const refundPreview = (o: MyOrder) => {
    if (o.paymentStatus !== 'paid') return t.refundPreviewUnpaid;
    const percent = customerRefundPercent(o.eventDate);
    if (percent === 0) return t.refundPreviewZero;
    return fill(t.refundPreview, { percent });
  };

  const cancel = async (id: string) => {
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', credentials: 'include' });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; refund?: { amountSar: number } };
      if (!res.ok || !data.success) {
        setMessage({ tone: 'err', text: data.error || t.cancelFailed });
        return;
      }
      const amount = data.refund?.amountSar || 0;
      setMessage({ tone: 'ok', text: amount > 0 ? fill(t.cancelledRefund, { id, amount: money(amount, ar) }) : fill(t.cancelled, { id }) });
      load();
    } catch {
      setMessage({ tone: 'err', text: t.coErrNet });
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  };

  const header = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.ordersTitle}</h1>
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-line" role="tablist">
        {[t.active, t.past].map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i as 0 | 1)}
            className={cn('h-9 px-[18px] rounded-[9px] text-sm font-semibold min-h-0 transition-all', tab === i ? 'bg-navy text-white' : 'text-ink-1')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  if (!sf.user) {
    return (
      <main className="max-w-[900px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        {header}
        <div className="mt-6 py-14 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <ClipboardList className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{t.ordersGuest}</div>
          <div className="text-sm text-ink-3 mt-1.5">{t.ordersGuestSub}</div>
          <button type="button" onClick={() => sf.navigate('/login?next=/orders')} className="mt-[22px] h-12 px-6 rounded-xl bg-action text-white text-[15px] font-semibold">
            {t.signIn}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      {header}
      {message ? (
        <p role="status" className={cn('mt-4 text-sm rounded-control px-3.5 py-2.5', message.tone === 'err' ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success')}>
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 mt-6">
        {status === 'loading' && !orders ? (
          [0, 1].map((i) => <div key={i} className="usil-skeleton h-44 rounded-card" />)
        ) : status === 'error' ? (
          <div role="alert" className="py-12 px-6 text-center bg-surface border border-danger-border rounded-card">
            <div className="text-lg font-bold">{t.ordersError}</div>
            <button type="button" onClick={load} className="mt-4 h-11 px-5 rounded-xl bg-action text-white text-sm font-semibold">
              {t.retry}
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="py-14 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
            <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
              <ClipboardList className="w-7 h-7" aria-hidden />
            </span>
            <div className="text-xl font-bold mt-[18px]">{t.ordersEmpty}</div>
            <div className="text-sm text-ink-3 mt-1.5">{t.ordersEmptySub}</div>
            <button type="button" onClick={() => sf.goCatalog()} className="mt-[22px] h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold">
              {t.browse}
            </button>
          </div>
        ) : (
          list.map((o) => {
            const step = stepOf(o.status);
            const past = FINAL.has(o.status);
            const dead = o.status === 'ملغي' || o.status === 'مرفوض من المورّد';
            const cancellable = !NOT_CANCELLABLE.has(o.status);
            const listing = listingOf(o);
            const vendor = vendorOf(o);
            const qty = (o.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 1;
            const createdAt = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '';
            return (
              <Reveal key={o.id} as="article" className="bg-surface border border-line rounded-card p-[18px]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span dir="ltr" className="text-[13px] text-ink-3 tnum">
                    {o.id}
                    {createdAt ? ` · ${createdAt}` : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={cn('px-3 py-[5px] rounded-md text-xs font-bold', statusTone(o.status))}>{statusLabel(o.status)}</span>
                    <span className={cn('px-3 py-[5px] rounded-md text-xs font-bold', o.paymentStatus === 'paid' ? 'bg-success-bg text-success' : 'bg-tint-slate text-ink-1')}>
                      {o.paymentStatus === 'paid' ? t.paid : t.unpaid}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3.5 items-center mt-3.5">
                  <button
                    type="button"
                    onClick={() => (listing ? sf.goProduct(listing.id) : undefined)}
                    className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-paper block min-h-0 p-0"
                    aria-label={o.serviceName}
                  >
                    {listing && productPhoto(listing) ? <img src={productPhoto(listing)} alt="" className="w-full h-full object-cover block" /> : null}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-3 truncate">{vendor?.vendorName || listing?.provider?.name || ''}</div>
                    <div className="text-[15px] font-semibold mt-0.5 leading-[1.4]">{o.serviceName}</div>
                    <div className="flex items-center gap-3 text-[13px] text-ink-3 mt-1 flex-wrap tnum">
                      <span>×{qty}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden />
                        {o.eventDate}
                      </span>
                      {o.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden />
                          {o.city}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-[17px] font-bold whitespace-nowrap tnum">{money(Number(o.totalAmount) || 0, ar)}</div>
                </div>

                {!dead ? (
                  <>
                    <div className="mt-4">
                      <StepRail step={step} />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-3 mt-1.5">
                      <span>{t.status0}</span>
                      <span>{t.status1}</span>
                      <span>{t.status2}</span>
                      <span>{t.status3}</span>
                    </div>
                  </>
                ) : null}
                {o.cancellation?.note ? <p className="mt-3 text-xs text-ink-1">{o.cancellation.note}</p> : null}

                <div className="flex gap-2 mt-4 flex-wrap">
                  {o.paymentStatus === 'unpaid' && cancellable && isMoyasarUrl(o.paymentUrl) ? (
                    <button type="button" onClick={() => window.location.assign(String(o.paymentUrl))} className="h-10 px-4 rounded-control bg-action text-white text-[13px] font-semibold min-h-0">
                      {t.resumePay}
                    </button>
                  ) : null}
                  {past ? (
                    <>
                      {listing ? (
                        <button type="button" onClick={() => sf.goProduct(listing.id)} className="h-10 px-4 rounded-control bg-navy text-white text-[13px] font-semibold min-h-0 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5" aria-hidden />
                          {t.reorder}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {listing ? (
                        <button type="button" onClick={() => sf.goProduct(listing.id)} className="h-10 px-4 rounded-control border border-navy-300 bg-surface text-navy text-[13px] font-semibold min-h-0">
                          {t.details}
                        </button>
                      ) : null}
                      {vendor && sf.canMessageVendors ? (
                        <button
                          type="button"
                          onClick={() => sf.messageVendor({ ...vendor, context: { type: 'booking', id: o.id, title: o.serviceName } })}
                          className="h-10 px-4 rounded-control bg-action text-white text-[13px] font-semibold min-h-0 flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-[15px] h-[15px]" aria-hidden />
                          {t.chatVendor}
                        </button>
                      ) : null}
                      {cancellable && confirming !== o.id ? (
                        <button type="button" onClick={() => setConfirming(o.id)} className="h-10 px-3 rounded-control text-ink-3 text-[13px] font-semibold min-h-0 hover:text-danger">
                          {t.cancelOrder}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>

                {cancellable && confirming === o.id ? (
                  <div className="mt-3 rounded-control border border-danger-border bg-danger-bg p-3.5">
                    <p className="text-xs text-danger font-medium">
                      {t.cancelNote} {refundPreview(o)}
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        type="button"
                        disabled={busy === o.id}
                        onClick={() => void cancel(o.id)}
                        className="h-10 px-4 rounded-control bg-danger text-white text-[13px] font-bold min-h-0 disabled:opacity-60"
                      >
                        {t.confirmCancel}
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-10 px-4 rounded-control bg-surface border border-line text-navy text-[13px] font-semibold min-h-0">
                        {t.undo}
                      </button>
                    </div>
                  </div>
                ) : null}
              </Reveal>
            );
          })
        )}
      </div>
    </main>
  );
}
