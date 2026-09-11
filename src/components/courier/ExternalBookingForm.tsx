import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../../data/services';
import { PlaceSearchSelect } from '../PlaceSearchSelect';

export const EXTERNAL_STATUSES = ['جديد', 'مؤكد', 'منفّذ', 'ملغي'] as const;

export const COLLECTION_OPTIONS = [
  { id: 'cash', label: 'كاش' },
  { id: 'transfer', label: 'تحويل' },
  { id: 'vendor_collect', label: 'تحصيل مع المورّد' },
] as const;

export type ExternalBookingRow = {
  id: string;
  courierId: string;
  courierName: string;
  customerName: string;
  phone: string;
  city: string;
  serviceType: string;
  eventDate: string;
  deliveryTime: string;
  guests: number | null;
  amount: number;
  taxIncluded: boolean;
  collection: 'cash' | 'transfer' | 'vendor_collect';
  vendorName: string;
  address: string;
  notes: string;
  status: string;
  createdAt: string;
};

type CourierOption = { id: string; name: string; source: 'account' | 'application' };

const inputClass =
  'w-full bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-3 py-2.5 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:bg-white focus:border-[#155EEF]';

const emptyForm = () => ({
  courierId: '',
  customerName: '',
  phone: '',
  city: '',
  serviceType: '',
  eventDate: '',
  deliveryTime: '',
  guests: '',
  amount: '',
  taxIncluded: false,
  collection: 'cash' as (typeof COLLECTION_OPTIONS)[number]['id'],
  vendorName: '',
  address: '',
  notes: '',
  status: 'جديد' as (typeof EXTERNAL_STATUSES)[number],
});

function clientValidate(form: ReturnType<typeof emptyForm>, needsCourier: boolean): string {
  if (needsCourier && !form.courierId) return 'اختر المندوب صاحب الحجز';
  if (!form.customerName.trim()) return 'اكتب اسم العميل';
  if (!/^05\d{8}$/.test(form.phone.replace(/\D/g, ''))) return 'أدخل جوالاً سعودياً صحيحاً بصيغة 05xxxxxxxx';
  if (!form.city.trim()) return 'اكتب المدينة';
  if (!form.serviceType.trim()) return 'اكتب نوع المناسبة أو الخدمة';
  if (!form.eventDate) return 'اختر تاريخ المناسبة';
  if (!String(form.amount).trim() || Number(form.amount) < 0 || Number.isNaN(Number(form.amount))) {
    return 'اكتب المبلغ المتفق عليه بالريال';
  }
  return '';
}

export function ExternalBookingForm({
  variant = 'panel',
  onSaved,
}: {
  variant?: 'panel' | 'plain';
  onSaved?: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(true);
  const [courierError, setCourierError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/external-bookings/couriers', { credentials: 'include' });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !data.success) {
          setCourierError(data.error || 'تعذر تحميل قائمة المناديب.');
          return;
        }
        const rows: CourierOption[] = data.data || [];
        setCouriers(rows);
        if (rows.length === 1) setForm((prev) => ({ ...prev, courierId: rows[0].id }));
      } catch {
        if (alive) setCourierError('تعذر الاتصال بالخادم.');
      } finally {
        if (alive) setLoadingCouriers(false);
      }
    })();
    (async () => {
      try {
        const res = await fetch('/api/admin/vendor-hubs', { credentials: 'include' });
        const data = await res.json();
        if (!alive || !res.ok || !data.success) return;
        setVendors(
          (data.data || [])
            .map((hub: { projectName?: string; name?: string }) => hub.projectName || hub.name || '')
            .filter(Boolean),
        );
      } catch {
        /* قائمة الموردين اختيارية — الخانة تبقى نصاً حراً */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const categoryNames = useMemo(() => CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => cat.name), []);
  const singleCourier = couriers.length === 1;

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setDone('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = clientValidate(form, !singleCourier);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/external-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courierId: form.courierId || couriers[0]?.id || '',
          customerName: form.customerName.trim(),
          phone: form.phone.replace(/\D/g, ''),
          city: form.city.trim(),
          serviceType: form.serviceType.trim(),
          eventDate: form.eventDate,
          deliveryTime: form.deliveryTime,
          guests: form.guests === '' ? null : Number(form.guests),
          amount: Number(form.amount),
          taxIncluded: form.taxIncluded,
          collection: form.collection,
          vendorName: form.vendorName.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر تسجيل الحجز الخارجي');
        return;
      }
      const keepCourier = form.courierId;
      setForm({ ...emptyForm(), courierId: keepCourier });
      setDone('تم تسجيل الحجز الخارجي');
      onSaved?.();
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  };

  const wrapperClass =
    variant === 'panel'
      ? 'bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm'
      : '';

  return (
    <section className={wrapperClass} dir="rtl">
      {variant === 'panel' ? (
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4 text-[#155EEF]" />
          <h2 className="text-base sm:text-lg font-black text-[#0A1A33]">تسجيل حجز خارجي</h2>
        </div>
      ) : null}
      <p className="text-[11px] sm:text-xs text-slate-500 mb-4 leading-relaxed">
        الحجز اللي جاك خارج المنصة: سجّل بيانات الشخص اللي حجز معك عشان يوصل توثّقه وتتابعه.
      </p>

      {loadingCouriers ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          جارٍ تحميل قائمة المناديب…
        </div>
      ) : courierError ? (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{courierError}</span>
        </div>
      ) : couriers.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">
          ما فيه مناديب معتمدين بعد. اعتمد مندوباً من تبويب «مناديب التوصيل» أو أنشئ حساب مندوب أولاً.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">المندوب</span>
              {singleCourier ? (
                <input className={`${inputClass} bg-slate-100`} value={couriers[0].name} readOnly />
              ) : (
                <select className={inputClass} value={form.courierId} onChange={(e) => set('courierId', e.target.value)}>
                  <option value="">اختر المندوب</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                      {courier.source === 'account' ? ' — حساب مندوب' : ''}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">اسم العميل</span>
              <input
                className={inputClass}
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                placeholder="اسم الشخص اللي حجز معك"
              />
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">رقم الجوال</span>
              <input
                className={`${inputClass} font-mono`}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="05xxxxxxxx"
                inputMode="numeric"
                dir="ltr"
              />
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">المدينة</span>
              <PlaceSearchSelect
                value={form.city}
                onChange={(city) => set('city', city)}
                includeAll={false}
                boxed
                aria-label="المدينة"
                placeholder="ابحث مدينة أو محافظة أو قرية"
              />
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">نوع المناسبة / الخدمة</span>
              <input
                className={inputClass}
                value={form.serviceType}
                onChange={(e) => set('serviceType', e.target.value)}
                placeholder="زواج، عزيمة، قهوة…"
                list="usil-external-service-types"
              />
              <datalist id="usil-external-service-types">
                {categoryNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">تاريخ المناسبة</span>
              <input
                type="date"
                className={inputClass}
                value={form.eventDate}
                onChange={(e) => set('eventDate', e.target.value)}
              />
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">
                وقت التسليم / الموعد <span className="text-slate-400 font-normal">(اختياري)</span>
              </span>
              <input
                type="time"
                className={inputClass}
                value={form.deliveryTime}
                onChange={(e) => set('deliveryTime', e.target.value)}
              />
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">
                عدد الضيوف <span className="text-slate-400 font-normal">(اختياري)</span>
              </span>
              <input
                className={inputClass}
                value={form.guests}
                onChange={(e) => set('guests', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="40"
                inputMode="numeric"
                dir="ltr"
              />
            </label>

            <div className="text-sm min-w-0">
              <label className="block">
                <span className="text-slate-600 mb-1.5 block font-bold">المبلغ المتفق عليه (ر.س)</span>
                <input
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
                  placeholder="1200"
                  inputMode="decimal"
                  dir="ltr"
                />
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#155EEF]"
                  checked={form.taxIncluded}
                  onChange={(e) => set('taxIncluded', e.target.checked)}
                />
                المبلغ شامل الضريبة
              </label>
            </div>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">طريقة التحصيل</span>
              <select
                className={inputClass}
                value={form.collection}
                onChange={(e) => set('collection', e.target.value as typeof form.collection)}
              >
                {COLLECTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">
                المورّد المرتبط <span className="text-slate-400 font-normal">(اختياري)</span>
              </span>
              <input
                className={inputClass}
                value={form.vendorName}
                onChange={(e) => set('vendorName', e.target.value)}
                placeholder="اسم المورّد إن وجد"
                list="usil-external-vendors"
              />
              <datalist id="usil-external-vendors">
                {vendors.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">الحالة</span>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value as typeof form.status)}
              >
                {EXTERNAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm sm:col-span-2 min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">
                العنوان / الموقع <span className="text-slate-400 font-normal">(اختياري)</span>
              </span>
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="الحي والشارع أو رابط الموقع"
              />
            </label>

            <label className="block text-sm sm:col-span-2 min-w-0">
              <span className="text-slate-600 mb-1.5 block font-bold">
                ملاحظات <span className="text-slate-400 font-normal">(اختياري)</span>
              </span>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="أي تفاصيل تخص الحجز"
              />
            </label>
          </div>

          {error ? (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {done ? (
            <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{done}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            {saving ? 'جارٍ الحفظ…' : 'تسجيل الحجز الخارجي'}
          </button>
        </form>
      )}
    </section>
  );
}
