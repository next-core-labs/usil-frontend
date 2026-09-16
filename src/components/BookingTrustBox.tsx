import React from 'react';
import { ShieldCheck, Clock, BadgePercent, Truck } from 'lucide-react';
import { ServiceItem } from '../types';

const VAT_RATE = 0.15;

export function vatPortion(gross: number): number {
  return Math.round((gross * VAT_RATE) / (1 + VAT_RATE));
}

export function cancellationHoursOf(service: ServiceItem): number {
  return service.cancellationHours ?? 48;
}

interface BookingTrustBoxProps {
  services: ServiceItem[];
  totalGross: number;
  compact?: boolean;
}

export const BookingTrustBox: React.FC<BookingTrustBoxProps> = ({
  services,
  totalGross,
  compact = false,
}) => {
  const vatIncluded = services.every((s) => s.vatIncluded !== false);
  const delayGuarantee = services.some((s) => s.delayGuarantee !== false);
  const vat = vatIncluded ? vatPortion(totalGross) : Math.round(totalGross * VAT_RATE);

  return (
    <div
      className={`rounded-2xl border ${
        compact
          ? 'border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5'
          : 'border-line bg-paper p-4 space-y-2.5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-medium text-ink-2">
          {totalGross > 0 ? 'السعر النهائي للدفع' : 'السعر'}
        </span>
        <span className="text-base font-bold text-navy font-mono">
          {totalGross > 0 ? `${totalGross.toLocaleString('ar-SA')} ر.س` : 'يثبّته المورّد'}
        </span>
      </div>
      <ul className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-1.5 text-2xs`}>
        <li className="flex items-center gap-1.5 text-[#027A48] font-bold">
          <BadgePercent className="w-3.5 h-3.5 shrink-0" />
          {vatIncluded
            ? totalGross > 0
              ? `شامل ضريبة القيمة المضافة 15% (حصة الضريبة ≈ ${vat.toLocaleString('ar-SA')} ر.س)`
              : 'الضريبة 15% تُحسب بعد ما المورّد يثبّت السعر'
            : `يُضاف ضريبة 15% ≈ ${vat.toLocaleString('ar-SA')} ر.س عند الفاتورة`}
        </li>
        <li className="flex items-center gap-1.5 text-ink-1 font-semibold">
          <Clock className="w-3.5 h-3.5 shrink-0 text-action" />
          <span>
            الإلغاء حسب قرب الموعد (كامل / 50٪ / لا استرجاع) —{' '}
            <a href="/refund" className="text-action font-bold hover:underline">
              سياسة الاسترجاع
            </a>
          </span>
        </li>
        {delayGuarantee ? (
          <li className="flex items-center gap-1.5 text-ink-1 font-semibold">
            <Truck className="w-3.5 h-3.5 shrink-0 text-action" />
            ضمان التأخير: إذا تخلّف مورّد نتابع البديل
          </li>
        ) : null}
        <li className="flex items-center gap-1.5 text-ink-1 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-action" />
          {totalGross > 0
            ? 'السعر المعروض هو النهائي — بدون مفاجآت بعد الاتفاق'
            : 'ميسر ما يخصم إلا بعد سعر يثبّته المورّد'}
        </li>
      </ul>
    </div>
  );
};
