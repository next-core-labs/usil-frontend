import React, { useEffect, useState } from 'react';
import { Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  SOCIAL_NETWORKS,
  socialsFormValues,
  statusLabel,
  type SocialNetwork,
  type VendorSocials,
} from '../../contracts/vendors/vendor-socials';
import { emptySocialFormValues, VendorSocialsForm } from './VendorSocialsForm';
import { VendorSocialIcons } from './VendorSocialIcons';

export function VendorSocialsPanel() {
  const [values, setValues] = useState(emptySocialFormValues());
  const [confirmedOwn, setConfirmedOwn] = useState(false);
  const [socials, setSocials] = useState<VendorSocials | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apply = (data: VendorSocials) => {
    setSocials(data);
    setValues(socialsFormValues(data));
    setConfirmedOwn(Boolean(data.confirmedOwn));
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vendor/socials', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) apply(json.data);
      })
      .catch(() => {
        if (!cancelled) setError('تعذر تحميل حسابات التواصل');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const res = await fetch('/api/vendor/socials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...values, confirmedOwn }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر حفظ الحسابات');
        return;
      }
      apply(data.data);
      setSaved('انحفظت الحسابات. العميل يشوفها في ملف المورد بعد تحديث قوي للصفحة.');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const statuses = Object.fromEntries(
    (socials?.links || []).map((link) => [link.network, statusLabel(link.status)]),
  ) as Partial<Record<SocialNetwork, string>>;

  return (
    <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 card-shadow space-y-5" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#155EEF]" />
            حسابات التواصل
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            اربط إنستغرام وتيك توك وسناب وإكس ويوتيوب وواتساب الأعمال. بعد الحفظ تظهر الأيقونات في ملف المورد. شارة «موثّق» تظهر فقط إذا راجعت الإدارة الرابط على يوصل.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">جارٍ التحميل…</p>
      ) : (
        <>
          <VendorSocialsForm
            values={values}
            onChange={(network, value) => {
              setValues((prev) => ({ ...prev, [network]: value }));
              setSaved('');
            }}
            confirmedOwn={confirmedOwn}
            onConfirmedOwnChange={setConfirmedOwn}
            statuses={statuses}
          />
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-500 mb-2">كيف يطلع للعميل</p>
            <VendorSocialIcons links={socials?.links} />
          </div>
        </>
      )}

      {error ? (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}
      {saved ? (
        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{saved}</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || loading}
        className="px-5 py-2.5 rounded-xl bg-[#155EEF] text-white text-sm font-bold disabled:opacity-60"
      >
        {saving ? 'جارٍ الحفظ…' : 'حفظ الحسابات'}
      </button>
      <p className="text-[11px] text-slate-400">
        الشبكات: {SOCIAL_NETWORKS.map((n) => n).join(' · ')} — الحفظ لا يغيّر توثيق الإدارة إذا بقي نفس الرابط.
      </p>
    </div>
  );
}
