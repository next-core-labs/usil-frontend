import React from 'react';
import { controlClass } from '../ui/Field';
import {
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  SOCIAL_PLACEHOLDERS,
  type SocialNetwork,
} from '../../contracts/vendors/vendor-socials';

const inputClass = controlClass;

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
    <section className="rounded-2xl border border-line bg-white p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-navy">حسابات التواصل — اربطها عشان العميل يشوفها</h3>
        <p className="text-2xs text-slate-500 leading-relaxed mt-1">
          الصق رابط الحساب الرسمي أو المعرّف @. التوثيق هنا يعني إن الإدارة راجعت الرابط على يوصل — مو علامة ميتا أو تيك توك الزرقاء.
        </p>
        {requireOneHint ? (
          <p className="text-2xs font-medium text-action mt-1">اربط حساباً واحداً على الأقل في طلب الانضمام.</p>
        ) : null}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {SOCIAL_NETWORKS.map((network) => (
          <label key={network} className="block text-sm">
            <span className="text-slate-600 mb-1.5 flex items-center justify-between font-bold">
              <span>{SOCIAL_LABELS[network]}</span>
              {statuses?.[network] ? (
                <span className="text-2xs font-medium text-slate-500">{statuses[network]}</span>
              ) : (
                <span className="text-2xs font-normal text-slate-400">اختياري</span>
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
          <span className="font-bold text-navy">هذا الحساب لي.</span> أؤكد أن الروابط أعلاه لحساباتي الرسمية، وتظهر للعميل في ملف المورد بعد الحفظ.
        </span>
      </label>
    </section>
  );
}
