import React from 'react';
import { Store, X } from 'lucide-react';
import type { VendorHubRow } from '../../contracts/vendors/vendor-hubs';

const STATUS_LABEL: Record<VendorHubRow['status'], string> = {
  approved: 'معتمد',
  pending: 'بانتظار الموافقة',
  rejected: 'مرفوض',
};

export function VendorHubPicker({
  hubs,
  loading,
  error,
  onClose,
  onSelect,
}: {
  hubs: VendorHubRow[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSelect: (hub: VendorHubRow) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 usil-safe-bottom" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#155EEF]">مدير الحسابات</p>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">اختَر حساب مورّد</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ما عندك مساحة مورّد خاصة. ادخل لوحة أي مورّد معتمد — وتقدر تفتح الطلبات المنتظرة أيضاً.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto overscroll-contain p-3 space-y-2">
          {loading ? <p className="text-sm text-slate-500 p-4">جارٍ تحميل حسابات الموردين…</p> : null}
          {error ? <p className="text-sm text-rose-600 p-4">{error}</p> : null}
          {!loading && !hubs.length ? (
            <p className="text-sm text-slate-500 p-4">ما فيه طلبات أو مساحات مورّدين بعد.</p>
          ) : null}
          {hubs.map((hub) => (
            <button
              key={hub.vendorId}
              type="button"
              onClick={() => onSelect(hub)}
              className="w-full text-right rounded-2xl border border-slate-200 bg-slate-50 hover:bg-[#EAF0FE] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">{hub.projectName || hub.name}</p>
                    <p className="text-[11px] text-slate-500 truncate" dir="ltr">
                      {hub.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    hub.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : hub.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {STATUS_LABEL[hub.status]}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {hub.listingCount} منتج · {hub.bookingCount} حجز
                {hub.isOwn ? ' · حسابك' : ''}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
