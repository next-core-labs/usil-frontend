import React, { useEffect, useState } from 'react';
import { LogOut, Store, ClipboardList, Clock } from 'lucide-react';
import type { SessionUser } from './LoginScreen';
import { BOOKING_PENDING_APPROVAL_STATUS, BOOKING_REJECTED_STATUS } from './contracts/vendors/vendor-listings';

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceName: string;
  notes: string;
  status: string;
  createdAt: string;
};

export function VendorWorkspace({
  session,
  onLogout,
}: {
  session: SessionUser;
  onLogout: () => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = () => {
    fetch('/api/bookings', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setBookings(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-amber-400">واجهة الموردين</p>
              <h1 className="font-bold">{session.name}</h1>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid sm:grid-cols-4 gap-3">
          <Stat label="الطلبات" value={String(bookings.length)} icon={ClipboardList} />
          <Stat
            label="بانتظار موافقتك"
            value={String(bookings.filter((b) => b.status === BOOKING_PENDING_APPROVAL_STATUS).length)}
            icon={Clock}
          />
          <Stat
            label="قيد التنفيذ"
            value={String(bookings.filter((b) => b.status === 'قيد المعالجة').length)}
            icon={Clock}
          />
          <Stat
            label="مكتمل"
            value={String(bookings.filter((b) => b.status === 'مكتمل').length)}
            icon={Store}
          />
        </div>

        <h2 className="font-bold text-lg">طلبات التوريد المرتبطة بمنصتك</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد طلبات حالياً.</p>
        ) : (
          bookings.map((bk) => (
            <article key={bk.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-amber-400">{bk.id}</span>
                <span className="text-xs text-slate-500">{bk.createdAt}</span>
              </div>
              <h3 className="font-bold">{bk.serviceName}</h3>
              <p className="text-sm text-slate-400">العميل: {bk.name} — {bk.phone}</p>
              {bk.notes ? <p className="text-xs text-slate-500">{bk.notes}</p> : null}
              {bk.status === BOOKING_PENDING_APPROVAL_STATUS ? (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-amber-300">
                    طلب حجز بموافقة المورّد — {BOOKING_PENDING_APPROVAL_STATUS}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => updateStatus(bk.id, 'مؤكد')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300"
                    >
                      قبول الطلب
                    </button>
                    <button
                      onClick={() => updateStatus(bk.id, BOOKING_REJECTED_STATUS)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300"
                    >
                      رفض الطلب
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">الحالة: {bk.status}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => updateStatus(bk.id, 'قيد المعالجة')}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300"
                >
                  استلام للتنفيذ
                </button>
                <button
                  onClick={() => updateStatus(bk.id, 'مكتمل')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300"
                >
                  تم التوريد
                </button>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <Icon className="w-4 h-4 text-amber-400 mb-2" />
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
