import React from 'react';
import {
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  SOCIAL_PLACEHOLDERS,
  type SocialNetwork,
} from '../../contracts/vendors/vendor-socials';

const inputClass =
  'w-full bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-4 py-3 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:bg-white focus:border-[#155EEF]';

export type SocialFormValues = Record<SocialNetwork, string>;

export const emptySocialFormValues = (): SocialFormValues => ({
  instagram: '',
  tiktok: '',
  snapchat: '',
  x: '',
  youtube: '',
  whatsapp: '',
});

export function VendorSocialsForm({
  values,
  onChange,
  confirmedOwn,
  onConfirmedOwnChange,
  statuses,
  requireOneHint = false,
}: {
  values: SocialFormValues;
  onChange: (network: SocialNetwork, value: string) => void;
  confirmedOwn: boolean;
  onConfirmedOwnChange: (value: boolean) => void;
  statuses?: Partial<Record<SocialNetwork, string>>;
  requireOneHint?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-[#E4E7EC] bg-white p-4 space-y-3">
      <div>
        <h3 className="text-sm font-black text-[#0A1A33]">حسابات التواصل — اربطها عشان العميل يشوفها</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
          الصق رابط الحساب الرسمي أو المعرّف @. التوثيق هنا يعني إن الإدارة راجعت الرابط على يوصل — مو علامة ميتا أو تيك توك الزرقاء.
        </p>
        {requireOneHint ? (
          <p className="text-[11px] font-bold text-[#155EEF] mt-1">اربط حساباً واحداً على الأقل في طلب الانضمام.</p>
        ) : null}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {SOCIAL_NETWORKS.map((network) => (
          <label key={network} className="block text-sm">
            <span className="text-slate-600 mb-1.5 flex items-center justify-between font-bold">
              <span>{SOCIAL_LABELS[network]}</span>
              {statuses?.[network] ? (
                <span className="text-[10px] font-black text-slate-500">{statuses[network]}</span>
              ) : (
                <span className="text-[10px] font-normal text-slate-400">اختياري</span>
              )}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              value={values[network]}
              onChange={(e) => onChange(network, e.target.value)}
              placeholder={SOCIAL_PLACEHOLDERS[network]}
            />
          </label>
        ))}
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmedOwn}
          onChange={(e) => onConfirmedOwnChange(e.target.checked)}
        />
        <span>
          <span className="font-black text-[#0A1A33]">هذا الحساب لي.</span> أؤكد أن الروابط أعلاه لحساباتي الرسمية، وتظهر للعميل في ملف المورد بعد الحفظ.
        </span>
      </label>
    </section>
  );
}
