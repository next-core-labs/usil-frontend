import React from 'react';
import { AlertTriangle, CheckCircle, Lock, PhoneCall, Globe, Instagram, Link2 } from 'lucide-react';
import { BookingSource } from '../../types';

interface VendorConflictBadgeProps {
  hasConflict?: boolean;
  source: BookingSource;
}

export const VendorConflictBadge: React.FC<VendorConflictBadgeProps> = ({
  hasConflict,
  source,
}) => {
  const getSourceIconAndLabel = () => {
    switch (source) {
      case 'platform':
        return {
          icon: Globe,
          label: 'حجز المنصة المعتمد',
          bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'external_phone':
        return {
          icon: PhoneCall,
          label: 'حجز خارجي (مكالمة)',
          bgColor: 'bg-amber-50 text-amber-900 border-amber-200',
        };
      case 'external_instagram':
        return {
          icon: Instagram,
          label: 'حجز خارجي (إنستقرام)',
          bgColor: 'bg-purple-50 text-purple-900 border-purple-200',
        };
      case 'external_whatsapp':
        return {
          icon: PhoneCall,
          label: 'حجز خارجي (واتساب)',
          bgColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        };
      case 'direct_bio_link':
        return {
          icon: Link2,
          label: 'رابط البايو (0% عمولة)',
          bgColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        };
      default:
        return {
          icon: Globe,
          label: 'حجز عام',
          bgColor: 'bg-slate-50 text-slate-800 border-slate-200',
        };
    }
  };

  const { icon: Icon, label, bgColor } = getSourceIconAndLabel();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-bold border ${bgColor}`}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </span>

      {hasConflict ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>تنبيه: تعارض في التوقيت!</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>مؤكد بدون تعارض</span>
        </span>
      )}
    </div>
  );
};
