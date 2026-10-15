import React, { useState } from 'react';
import { ClientOrderTracking, VendorBrandSettings } from '../../types';
import { PublicOrderTrackerView } from './PublicOrderTrackerView';
import {
  Clock,
  Copy,
  Eye,
  MessageCircle,
  PackageSearch,
  Zap,
} from 'lucide-react';

interface VendorOrderTrackerManagerProps {
  trackings: ClientOrderTracking[];
  brandSettings: VendorBrandSettings;
  onUpdateStep: (trackingId: string, stepId: string, isCompleted: boolean) => void;
}

const STATUS_LABELS: Record<ClientOrderTracking['status'], string> = {
  draft: 'مسودة',
  confirmed: 'مؤكد',
  preparing: 'جاري التجهيز',
  on_the_way: 'الطاقم في الطريق',
  setup_ready: 'الموقع جاهز',
  completed: 'مكتمل',
};

export const VendorOrderTrackerManager: React.FC<VendorOrderTrackerManagerProps> = ({
  trackings: trackingsProp,
  brandSettings,
  onUpdateStep,
}) => {
  const trackings = trackingsProp ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Derive the selection from the live list so updates (and deletions) are reflected.
  const selectedTracking =
    trackings.find((t) => t.id === selectedId) ?? trackings[0] ?? null;

  const handleCopyCode = () => {
    if (!selectedTracking) return;
    void navigator.clipboard?.writeText(selectedTracking.trackingCode).catch(() => undefined);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!selectedTracking) {
    return (
      <div className="space-y-6 text-right">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 card-shadow text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <PackageSearch className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-base font-bold text-slate-900">لا توجد طلبات قيد التتبع حالياً</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            عند تأكيد حجز لديك سيظهر هنا لتحديث مراحل التجهيز (تجهيز المعدات، تحرك الطاقم، جاهزية الموقع) وإبلاغ العميل بها.
          </p>
        </div>
      </div>
    );
  }

  const clientMessage = `مرحباً ${selectedTracking.clientName}،\nتحديث بخصوص مناسبتكم (${selectedTracking.serviceTitle}) بتاريخ ${selectedTracking.eventDate}: الحالة الحالية «${STATUS_LABELS[selectedTracking.status] ?? 'مؤكد'}».\nرمز التتبع: ${selectedTracking.trackingCode}`;
  const clientPhoneDigits = (selectedTracking.clientPhone || '').replace(/\D/g, '');
  const timeline = selectedTracking.timeline ?? [];

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-navy text-white card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-medium border border-white/10">
            <Zap className="w-3.5 h-3.5" />
            <span>متابعة مراحل تجهيز الطلبات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            تتبع المناسبات للعميل
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            حدّث مراحل التجهيز لكل مناسبة وأرسل للعميل آخر حالة عبر واتساب.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4 text-sand" />
            <span>معاينة شاشة العميل</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="px-4 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed text-white text-xs font-medium flex items-center gap-2 shadow-xs transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedCode ? 'تم نسخ الرمز!' : 'نسخ رمز التتبع'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Order Tracking Selector + Active Timeline Manager */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left: Trackings List (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              الطلبات قيد التتبع ({trackings.length})
            </h3>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
            {trackings.map((trk) => {
              const isSelected = selectedTracking.id === trk.id;
              return (
                <div
                  key={trk.id}
                  onClick={() => setSelectedId(trk.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-action shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {trk.clientName}
                    </span>
                    <span className="text-2xs font-mono text-action font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {trk.trackingCode}
                    </span>
                  </div>

                  <div className="text-2xs text-slate-600 truncate mb-2">
                    {trk.serviceTitle}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">{trk.eventDate}</span>
                    <span className="px-2 py-0.5 rounded text-2xs font-medium bg-emerald-100 text-emerald-800">
                      {STATUS_LABELS[trk.status] ?? 'مؤكد'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Live Timeline Manager (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-action font-medium mb-1">
                  <span>المناسبة النشطة:</span>
                  <span className="font-mono">{selectedTracking.trackingCode}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTracking.clientName} - {selectedTracking.serviceTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  الموعد: {selectedTracking.eventDate} ({selectedTracking.eventTime}) • {selectedTracking.venueName}
                </p>
              </div>

              {clientPhoneDigits && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${clientPhoneDigits}?text=${encodeURIComponent(clientMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>إرسال الحالة للعميل</span>
                  </a>
                </div>
              )}
            </div>

            {/* Step Checkers for Vendor */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-action" />
                <span>تحديث مراحل التجهيز الميداني (اضغط لتحديث حالة العميل فورياً)</span>
              </h4>

              <div className="space-y-2.5">
                {timeline.length === 0 && (
                  <p className="text-xs text-slate-500 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    لا توجد مراحل مسجلة لهذا الطلب بعد.
                  </p>
                )}
                {timeline.map((step) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      step.isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={step.isCompleted}
                        onChange={(e) => onUpdateStep(selectedTracking.id, step.id, e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-medium text-slate-900 flex items-center gap-2">
                          <span>{step.title}</span>
                          {step.badgeText && (
                            <span className="text-2xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                              {step.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-slate-500 font-normal">{step.description}</p>
                      </div>
                    </div>

                    <span className="text-2xs font-mono text-slate-500 font-semibold bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0">
                      {step.timestamp || 'معلق'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Full Client Screen Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 flex items-center justify-center usil-modal-scroll">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <Eye className="w-4 h-4" />
                <span>معاينة حية كما يراها العميل على جواله</span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-xs font-medium bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 text-white"
              >
                إغلاق المعاينة
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PublicOrderTrackerView
                tracking={selectedTracking}
                brandSettings={brandSettings}
                onClose={() => setIsPreviewOpen(false)}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
