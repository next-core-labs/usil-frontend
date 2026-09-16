import React, { useState } from 'react';
import { ClientOrderTracking, VendorBrandSettings } from '../../types';
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Download,
  Calendar as CalendarIcon,
  Users,
  Navigation,
  Camera,
  ChevronRight,
  Share2,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface PublicOrderTrackerViewProps {
  tracking: ClientOrderTracking;
  brandSettings: VendorBrandSettings;
  onClose?: () => void;
  isEmbedPreview?: boolean;
}

export const PublicOrderTrackerView: React.FC<PublicOrderTrackerViewProps> = ({
  tracking,
  brandSettings,
  onClose,
  isEmbedPreview = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://usil.app/track/${tracking.trackingCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10 text-right font-sans">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* Top Floating Brand Header (100% White-Label) */}
        <div
          className="p-6 rounded-3xl text-white card-shadow relative overflow-hidden flex items-center justify-between gap-4"
          style={{ backgroundColor: brandSettings.primaryColor || '#0A1A33' }}
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <img
              src={brandSettings.logoUrl}
              alt={brandSettings.brandName}
              className="w-14 h-14 rounded-2xl object-cover border border-white/20 bg-white"
            />
            <div className="space-y-0.5">
              <span className="text-2xs text-sand font-medium tracking-wide block">
                تتبع المناسبة المباشر • {brandSettings.slogan}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {brandSettings.brandName}
              </h1>
              <p className="text-xs text-white/80 font-mono">
                سجل تجاري: {brandSettings.crNumber} | هاتف: {brandSettings.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 border border-white/20 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التتبع'}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
              >
                رجوع
              </button>
            )}
          </div>

          {/* Glow Effect */}
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Live Status Tracker Banner */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-500">حالة المناسبة الحالية:</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {tracking.status === 'preparing'
                    ? 'جاري تجهيز المعدات والطاقم'
                    : tracking.status === 'on_the_way'
                    ? 'الطاقم في الطريق للموقع'
                    : tracking.status === 'setup_ready'
                    ? 'الموقع جاهز وبدء الضيافة'
                    : 'حجز مؤكد'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {tracking.serviceTitle}
              </h2>
            </div>

            <div className="text-left font-mono">
              <span className="text-2xs text-slate-400 block">رمز التتبع المباشر:</span>
              <span className="text-xs font-medium text-action bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                {tracking.trackingCode}
              </span>
            </div>
          </div>

          {/* Quick Event Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-2xs text-slate-500 font-medium flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-slate-400" />
                <span>تاريخ المناسبة</span>
              </span>
              <div className="font-bold text-slate-900">{tracking.eventDate}</div>
              <span className="text-2xs text-slate-500 font-mono">{tracking.eventTime}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-2xs text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>مقر الفعالية</span>
              </span>
              <div className="font-bold text-slate-900 truncate">{tracking.venueName}</div>
              <span className="text-2xs text-slate-500">{tracking.city}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-2xs text-slate-500 font-medium flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>الضيوف المعتمدين</span>
              </span>
              <div className="font-bold font-mono text-slate-900">{tracking.guestCount} شخص</div>
              <span className="text-2xs text-emerald-700 font-semibold">طاقم كافي</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-2xs text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>حالة الدفع</span>
              </span>
              <div className="font-bold font-mono text-action">
                {tracking.remainingBalance === 0 ? 'مدفوع بالكامل' : `متبقي ${tracking.remainingBalance} ر.س`}
              </div>
              <span className="text-2xs text-slate-500">تم دفع العربون</span>
            </div>
          </div>
        </div>

        {/* Live Timeline Stepper */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-action" />
              <span>المخطط الزمني المباشر للمناسبة (Live Timeline)</span>
            </h3>
            <span className="text-2xs text-slate-500">تحديث فوري عبر النظام</span>
          </div>

          <div className="relative pl-2 pr-4 space-y-6 before:absolute before:right-7 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {tracking.timeline.map((step, idx) => (
              <div key={step.id} className="relative flex items-start gap-4">
                
                {/* Step Icon Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    step.isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                      : step.isCurrent
                      ? 'bg-action text-white ring-4 ring-blue-100 animate-bounce'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-mono font-medium">{idx + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-xs font-medium text-slate-900">
                      {step.title}
                    </h4>
                    {step.timestamp && (
                      <span className="text-2xs font-mono text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {step.description}
                  </p>
                  {step.badgeText && (
                    <span className="inline-block text-2xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {step.badgeText}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Assigned Supervisor & Direct Contact */}
        {tracking.assignedSupervisor && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-action" />
              <span>مشرف الضيافة الميداني المخصص لمناسبتكم</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={tracking.assignedSupervisor.avatar}
                  alt={tracking.assignedSupervisor.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {tracking.assignedSupervisor.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {tracking.assignedSupervisor.role}
                  </p>
                  <span className="text-2xs text-emerald-700 font-medium">
                    جاهز للتواصل وتنسيق الدخول
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${tracking.assignedSupervisor.phone}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>اتصال مباشر</span>
                </a>

                <a
                  href={`https://wa.me/${tracking.assignedSupervisor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `مرحباً ${tracking.assignedSupervisor.name}، بخصوص مناسبة ${tracking.clientName} لتاريخ ${tracking.eventDate}، حابين ننسق بخصوص الدخول.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب المشرف</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Live Location / Directions */}
        {tracking.liveLocationCoordinates && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-action" />
                <span>إحداثيات وموقع التوصيل المعتمد</span>
              </h3>
              <a
                href={`https://maps.google.com/?q=${tracking.liveLocationCoordinates.lat},${tracking.liveLocationCoordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-action font-medium flex items-center gap-1 hover:underline"
              >
                <span>فتح في خرائط Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-action shrink-0" />
              <span className="font-medium">{tracking.liveLocationCoordinates.addressText}</span>
            </div>
          </div>
        )}

        {/* Setup Photos Stream */}
        {tracking.setupPhotos && tracking.setupPhotos.length > 0 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-action" />
              <span>صور توثيق التجهيز الميداني المعتمد</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tracking.setupPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`تجهيز ${i + 1}`}
                  className="w-full h-36 rounded-2xl object-cover border border-slate-200 hover:opacity-95 transition-opacity"
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">
            {brandSettings.brandName} • خدمة عملاء وضيافة على مدار الساعة
          </p>
          <p className="text-2xs">
            لأي استفسار أو تعديل في وقت التقديم، يرجى التواصل على {brandSettings.phone}
          </p>
        </div>

      </div>
    </div>
  );
};
