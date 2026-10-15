import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  Check,
  X,
  PlayCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, Tabs } from '../ui';
import type { BadgeTone } from '../ui';
import { vendorApiUrl } from '../../utils/vendorWorkspace';

/** A platform order as `GET /api/bookings` returns it to a vendor (trimmed to the vendor's own lines). */
export type VendorPlatformOrder = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  serviceName: string;
  notes?: string;
  city?: string;
  eventDate: string;
  eventTime?: string;
  items?: Array<{ id: string; title: string; quantity: number; price: number; vendorId?: string }>;
  totalAmount: number;
  bookingMode?: 'instant' | 'approval';
  status: string;
  paymentStatus: 'unpaid' | 'paid';
  createdAt?: string;
};

export const PENDING_APPROVAL = 'بانتظار موافقة المورّد';
const CONFIRMED = 'مؤكد';
const REJECTED = 'مرفوض من المورّد';
const IN_PROGRESS = 'قيد التنفيذ';
const COMPLETED = 'مكتمل';
const CANCELLED = 'ملغي';
const FINAL = new Set([REJECTED, COMPLETED, CANCELLED]);

const STATUS_TONE: Record<string, BadgeTone> = {
  [PENDING_APPROVAL]: 'warning',
  [CONFIRMED]: 'info',
  [IN_PROGRESS]: 'action',
  [COMPLETED]: 'success',
  [REJECTED]: 'danger',
  [CANCELLED]: 'neutral',
  جديد: 'neutral',
};

function sar(amount: number): string {
  return `${Math.round(Number(amount) || 0).toLocaleString('en-US')} ر.س`;
}

function whatsappUrl(phone: string, text: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('05') ? `966${digits.slice(1)}` : digits.startsWith('966') ? digits : null;
  return intl ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : null;
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'تعذر الاتصال بالخادم');
  }
  return data;
}

/**
 * The vendor's platform orders, polled so a new «بانتظار موافقة المورّد» order
 * shows up (and badges the sidebar) without a reload. `vendorId` is the vendor
 * a supervising admin is acting for; vendors omit it.
 */
export function usePlatformOrders(vendorId?: string | null, enabled = true) {
  const [orders, setOrders] = useState<VendorPlatformOrder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await parse(
        await fetch(vendorApiUrl('/api/bookings', vendorId), { credentials: 'include' }),
      );
      setOrders(Array.isArray(data.data) ? (data.data as VendorPlatformOrder[]) : []);
      setStatus('ready');
    } catch {
      setStatus((prev) => (prev === 'ready' ? prev : 'error'));
    }
  }, [vendorId, enabled]);

  useEffect(() => {
    setStatus('loading');
    setOrders([]);
    void reload();
    if (!enabled) return;
    const timer = window.setInterval(() => void reload(), 60_000);
    const onFocus = () => void reload();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload, enabled]);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === PENDING_APPROVAL).length, [orders]);

  return { orders, setOrders, status, reload, pendingCount };
}

type Filter = 'pending' | 'active' | 'all';

type PendingAction = { order: VendorPlatformOrder; next: string; title: string; message: string; tone: 'danger' | 'primary' };

export function VendorPlatformOrdersPanel({
  orders,
  status,
  reload,
  onOrderUpdated,
  vendorId,
  onNotify,
}: {
  orders: VendorPlatformOrder[];
  status: 'loading' | 'ready' | 'error';
  reload: () => void;
  onOrderUpdated: (order: VendorPlatformOrder) => void;
  vendorId?: string | null;
  onNotify?: (msg: string) => void;
}) {
  const pendingCount = orders.filter((o) => o.status === PENDING_APPROVAL).length;
  const [filter, setFilter] = useState<Filter>(pendingCount > 0 ? 'pending' : 'active');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingAction | null>(null);

  const visible = useMemo(() => {
    const rows =
      filter === 'pending'
        ? orders.filter((o) => o.status === PENDING_APPROVAL)
        : filter === 'active'
          ? orders.filter((o) => !FINAL.has(o.status))
          : orders;
    return [...rows].sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate)));
  }, [orders, filter]);

  const changeStatus = async (order: VendorPlatformOrder, next: string) => {
    setBusy(order.id);
    setError(null);
    try {
      const data = await parse(
        await fetch(vendorApiUrl(`/api/bookings/${encodeURIComponent(order.id)}`, vendorId), {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        }),
      );
      // Take only the state change from the reply: it is the full order row, while this list
      // shows the vendor's own lines (an admin acting for a vendor would otherwise see them all).
      const saved = (data.booking || {}) as Partial<VendorPlatformOrder>;
      onOrderUpdated({
        ...order,
        status: saved.status || next,
        paymentStatus: saved.paymentStatus || order.paymentStatus,
      });
      onNotify?.(
        next === CONFIRMED
          ? `تم قبول الطلب ${order.id} — أرسلنا للعميل رابط الدفع`
          : next === REJECTED
            ? `تم رفض الطلب ${order.id}`
            : `تم تحديث الطلب ${order.id} إلى «${next}»`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث الطلب');
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const ask = (order: VendorPlatformOrder, next: string) => {
    if (next === CONFIRMED) {
      setConfirm({
        order,
        next,
        tone: 'primary',
        title: 'قبول الطلب',
        message: `بتقبل طلب ${order.name} ليوم ${order.eventDate}. نرسل للعميل رابط الدفع، ويتثبت الحجز بعد ما يدفع.`,
      });
    } else if (next === REJECTED) {
      setConfirm({
        order,
        next,
        tone: 'danger',
        title: 'رفض الطلب',
        message: `بترفض طلب ${order.name}. العميل ما دفع شيء، ونبلغه إن الطلب مرفوض.`,
      });
    } else if (next === CANCELLED) {
      setConfirm({
        order,
        next,
        tone: 'danger',
        title: 'إلغاء الطلب',
        message: `بتلغي طلب ${order.name} قبل الدفع. ما تقدر ترجع عن الإلغاء.`,
      });
    } else {
      void changeStatus(order, next);
    }
  };

  if (status === 'loading') return <LoadingState label="جارٍ تحميل طلبات المنصة…" />;
  if (status === 'error') {
    return <ErrorState title="تعذر تحميل طلبات المنصة" onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">طلبات المنصة</h2>
          <p className="text-xs text-ink-3 mt-0.5">
            الطلبات اللي تحتاج موافقتك تنتظر قرارك. العميل يدفع بعد القبول، وبعد الدفع تقدر تبدأ التنفيذ.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={reload}>
          تحديث
        </Button>
      </div>

      <Tabs<Filter>
        ariaLabel="تصفية طلبات المنصة"
        size="sm"
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: 'pending', label: 'بانتظار موافقتك', count: pendingCount, countTone: 'warning' },
          { id: 'active', label: 'الطلبات المفتوحة' },
          { id: 'all', label: 'الكل', count: orders.length },
        ]}
      />

      {error ? (
        <div role="alert" className="rounded-card border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === 'pending' ? 'ما فيه طلبات تنتظر موافقتك' : 'ما فيه طلبات هنا'}
          description="أول ما يطلب عميل منتجاتك من المتجر يظهر طلبه هنا، ونرسل لك إيميل."
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((order) => {
            const paid = order.paymentStatus === 'paid';
            const wa = whatsappUrl(order.phone, `السلام عليكم ${order.name}، معك المورّد بخصوص طلبك ${order.id} في يوصل.`);
            const isBusy = busy === order.id;
            return (
              <li key={order.id} className="rounded-card border border-line bg-surface p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-navy truncate">
                        {order.serviceName || order.items?.[0]?.title || 'طلب من المتجر'}
                      </span>
                      <span className="text-2xs text-ink-3 font-mono tnum">{order.id}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden />
                        {order.eventDate}
                        {order.eventTime ? ` · ${order.eventTime}` : ''}
                      </span>
                      {order.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden />
                          {order.city}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[order.status] || 'neutral'} size="sm">
                      {order.status}
                    </Badge>
                    <Badge tone={paid ? 'success' : 'neutral'} size="sm">
                      {paid ? 'مدفوع' : 'غير مدفوع'}
                    </Badge>
                  </div>
                </div>

                {order.items && order.items.length > 0 ? (
                  <ul className="text-xs text-ink-2 space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={`${item.id}-${i}`} className="flex justify-between gap-3">
                        <span className="truncate">
                          {item.title} × {item.quantity}
                        </span>
                        <span className="tnum shrink-0">{sar(Number(item.price) * Number(item.quantity || 1))}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {order.notes ? (
                  <p className="text-xs text-ink-2 bg-paper rounded-control px-3 py-2">ملاحظات العميل: {order.notes}</p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-soft">
                  <div className="text-xs text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-ink">{order.name}</span>
                    {order.phone ? (
                      <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1 tnum hover:text-action">
                        <Phone className="w-3.5 h-3.5" aria-hidden />
                        {order.phone}
                      </a>
                    ) : null}
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#1a9e4b] hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                        واتساب
                      </a>
                    ) : null}
                    <span className="font-bold text-navy tnum">{sar(order.totalAmount)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === PENDING_APPROVAL ? (
                      <>
                        <Button size="sm" variant="primary" icon={Check} loading={isBusy} onClick={() => ask(order, CONFIRMED)}>
                          قبول
                        </Button>
                        <Button size="sm" variant="secondary" icon={X} disabled={isBusy} onClick={() => ask(order, REJECTED)}>
                          رفض
                        </Button>
                      </>
                    ) : null}
                    {!paid && (order.status === CONFIRMED || order.status === 'جديد') ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs text-warning">
                          <Clock className="w-3.5 h-3.5" aria-hidden />
                          بانتظار دفع العميل
                        </span>
                        <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => ask(order, CANCELLED)}>
                          إلغاء
                        </Button>
                      </>
                    ) : null}
                    {paid && order.status === CONFIRMED ? (
                      <Button size="sm" variant="primary" icon={PlayCircle} loading={isBusy} onClick={() => ask(order, IN_PROGRESS)}>
                        بدء التنفيذ
                      </Button>
                    ) : null}
                    {paid && order.status === IN_PROGRESS ? (
                      <Button size="sm" variant="primary" icon={CheckCircle2} loading={isBusy} onClick={() => ask(order, COMPLETED)}>
                        تم التنفيذ
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && void changeStatus(confirm.order, confirm.next)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.title || 'تأكيد'}
        tone={confirm?.tone || 'primary'}
        loading={Boolean(confirm && busy === confirm.order.id)}
      />
    </div>
  );
}
