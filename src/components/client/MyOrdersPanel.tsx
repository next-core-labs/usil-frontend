import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Badge, Button, type BadgeTone } from '../ui';
import { customerRefundPercent } from '../../contracts/shared/refund-policy';

/** A platform order as `GET /api/bookings` returns it to its client. */
type MyOrder = {
  id: string;
  serviceName: string;
  eventDate: string;
  totalAmount: number;
  status: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentUrl?: string;
  cancellation?: { note: string; refundPercent: number };
};

/** Mirrors the server's closed/started states; the server still has the final say. */
const NOT_CANCELLABLE = new Set(['ملغي', 'مرفوض من المورّد', 'مكتمل', 'قيد التنفيذ']);

function statusTone(status: string): BadgeTone {
  if (status === 'ملغي' || status === 'مرفوض من المورّد') return 'danger';
  if (status === 'مكتمل') return 'success';
  if (status === 'مؤكد' || status === 'قيد التنفيذ') return 'info';
  return 'warning';
}

/** Same rule as checkout: only ever navigate to Moyasar's hosted page. */
function isMoyasarUrl(url?: string): boolean {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase();
    return host === 'moyasar.com' || host.endsWith('.moyasar.com');
  } catch {
    return false;
  }
}

/** What cancelling now would return, worded from the published refund tiers. */
function refundPreview(order: MyOrder): string {
  if (order.paymentStatus !== 'paid') return 'الطلب غير مدفوع، فلا يوجد مبلغ للاسترجاع.';
  const percent = customerRefundPercent(order.eventDate);
  if (percent === 0) return 'حسب سياسة الاسترجاع لا يُسترجع أي مبلغ لهذا الموعد.';
  return `حسب سياسة الاسترجاع يُسترجع ${percent}٪ من المبلغ المدفوع عبر ميسر.`;
}

/**
 * «طلباتي» — the signed-in client's own platform orders, with cancellation.
 * Renders nothing for guests or other roles (the API answers 401/403).
 */
export const MyOrdersPanel: React.FC = () => {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: BadgeTone; text: string } | null>(null);

  const load = () => {
    fetch('/api/bookings', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrders(data && Array.isArray(data.data) ? (data.data as MyOrder[]) : null))
      .catch(() => setOrders(null));
  };

  useEffect(load, []);

  const cancelOrder = async (id: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        refund?: { percent: number; amountSar: number };
      };
      if (!res.ok || !data.success) {
        setMessage({ tone: 'danger', text: data.error || 'تعذر إلغاء الطلب. حاول مرة أخرى.' });
        return;
      }
      const amount = data.refund?.amountSar || 0;
      setMessage({
        tone: 'success',
        text: amount > 0
          ? `أُلغي الطلب ${id}. يُسترجع ${amount.toLocaleString('ar-SA')} ر.س عبر ميسر خلال 3 إلى 10 أيام عمل.`
          : `أُلغي الطلب ${id}.`,
      });
      load();
    } catch {
      setMessage({ tone: 'danger', text: 'تعذر الاتصال بالخادم. حاول مرة أخرى.' });
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  if (!orders) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3" aria-label="طلباتي">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-action" />
        <h3 className="text-sm font-bold text-slate-900">طلباتي من يوصل</h3>
        <span className="text-2xs text-slate-500">({orders.length})</span>
      </div>

      {message ? (
        <p
          role="status"
          className={`text-xs rounded-xl px-3 py-2 ${
            message.tone === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-xs text-slate-500">لا توجد طلبات مرتبطة بحسابك بعد.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const cancellable = !NOT_CANCELLABLE.has(order.status);
            return (
              <li key={order.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{order.serviceName}</p>
                    <p className="text-2xs text-slate-500 font-mono">
                      {order.id} · {order.eventDate} · {Number(order.totalAmount).toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge size="sm" tone={statusTone(order.status)}>{order.status}</Badge>
                    <Badge size="sm" tone={order.paymentStatus === 'paid' ? 'success' : 'neutral'}>
                      {order.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </Badge>
                  </div>
                </div>

                {order.cancellation ? (
                  <p className="text-2xs text-slate-600">{order.cancellation.note}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {order.paymentStatus === 'unpaid' && cancellable && isMoyasarUrl(order.paymentUrl) ? (
                    <Button size="sm" variant="primary" onClick={() => window.location.assign(String(order.paymentUrl))}>
                      إكمال الدفع
                    </Button>
                  ) : null}
                  {cancellable && confirmingId !== order.id ? (
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingId(order.id)}>
                      إلغاء الطلب
                    </Button>
                  ) : null}
                </div>

                {cancellable && confirmingId === order.id ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 space-y-2">
                    <p className="text-xs text-rose-800">{refundPreview(order)} تأكيد الإلغاء؟</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={busyId === order.id}
                        onClick={() => void cancelOrder(order.id)}
                      >
                        تأكيد الإلغاء
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmingId(null)}>
                        تراجع
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
