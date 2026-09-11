import React from 'react';
import { CheckCircle2, Clock, Store } from 'lucide-react';
import { FULFILLMENT_AR_LABEL } from '../../contracts/vendors/vendor-listings';
import { publicSocials } from '../../contracts/vendors/vendor-socials';
import type { VendorOwnProfile } from '../../contracts/vendors/vendor-profile';
import { vendorHandle } from '../../contracts/vendors/vendor-profile';
import { VendorSocialIcons } from './VendorSocialIcons';

const STATUS_AR: Record<VendorOwnProfile['status'], string> = {
  pending: 'بانتظار موافقة الإدارة',
  approved: 'معتمد — هذا ملفك',
  rejected: 'مرفوض — راجع الإدارة',
};

export function VendorOwnFileCard({
  profile,
  compact = false,
}: {
  profile: VendorOwnProfile;
  compact?: boolean;
}) {
  const handle = vendorHandle(profile.projectName, profile.vendorId);
  const socials = publicSocials(profile.socials);
  return (
    <article
      dir="rtl"
      className={`rounded-2xl border border-[#E4E7EC] bg-white text-right ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <div className="flex items-start gap-3">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt={profile.projectName}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#0A1A33] text-white flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[#155EEF]">{STATUS_AR[profile.status]}</p>
          <h3 className="text-lg font-black text-[#0A1A33] truncate">{profile.projectName || 'مشروعك'}</h3>
          <p className="text-sm text-slate-600">{profile.personName}</p>
          {profile.projectType ? <p className="text-xs text-slate-500 mt-0.5">{profile.projectType}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.fulfillment.map((lane) => (
          <span key={lane} className="px-2 py-0.5 rounded-full bg-[#155EEF] text-white text-[10px] font-extrabold">
            {FULFILLMENT_AR_LABEL[lane as keyof typeof FULFILLMENT_AR_LABEL] || lane}
          </span>
        ))}
      </div>
      {socials.length ? (
        <div className="mt-3">
          <VendorSocialIcons links={socials} />
        </div>
      ) : null}
      <p className="mt-3 text-[11px] text-slate-500 font-mono" dir="ltr">
        usil.app/vendor/{handle}
      </p>
      {profile.status === 'pending' ? (
        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed inline-flex items-start gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          السوق ما يظهر مشروعك للعملاء إلا بعد اعتماد الإدارة. اللي تشوفه هنا هو اللي سجّلته أنت.
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-emerald-800 leading-relaxed inline-flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          المنتجات تظهر باسم «{profile.projectName}» فقط — ما ننسخ كتالوج وهمي لحسابك.
        </p>
      )}
    </article>
  );
}
