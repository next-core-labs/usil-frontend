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
  Calendar as CalendarIcon,
  Users,
  Search,
  X,
  Share2,
  Star,
  Coffee,
  Truck,
  Building2,
  ChevronLeft,
  Navigation,
} from 'lucide-react';

interface ClientOrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackings: ClientOrderTracking[];
  brandSettings: VendorBrandSettings;
  initialTrackingCode?: string;
  onUpdateStep?: (trackingId: string, stepId: string, isCompleted: boolean) => void;
}

export const ClientOrderTrackingModal: React.FC<ClientOrderTrackingModalProps> = ({
  isOpen,
  onClose,
  trackings,
  brandSettings,
  initialTrackingCode,
  onUpdateStep,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTrackingCode || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [clientRating, setClientRating] = useState(5);
  const [clientFeedback, setClientFeedback] = useState('');
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  if (!isOpen) return null;

  // Find active tracking record
  const selectedTracking =
    trackings.find(
      (t) =>
        t.trackingCode.toLowerCase() === searchQuery.trim().toLowerCase() ||
        t.clientPhone.includes(searchQuery.trim()) ||
        t.id === searchQuery.trim()
    ) || trackings[0];

  const handleCopyLink = () => {
    if (!selectedTracking) return;
    navigator.clipboard.writeText(`https://usil.app/track/${selectedTracking.trackingCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFeedbackSubmitted(true);
    setTimeout(() => {
      setIsFeedbackSubmitted(false);
      setClientFeedback('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 text-right font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div
          className="p-5 sm:p-6 text-white relative overflow-hidden flex items-center justify-between gap-4 shrink-0"
          style={{ backgroundColor: brandSettings.primaryColor || '#0A1A33' }}
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <Coffee className="w-6 h-6 text-[#C0A16B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-[#C0A16B] font-mono">
                  LIVE TRACKING
                </span>
                <span className="text-xs text-white/80 font-medium">بوابة المتابعة المباشرة</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                تتبع ترتيبات وضيافة مناسبتك لحظة بلحظة
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Background subtle glow */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Search / Order Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم التتبع أو الجوال..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#155EEF]"
            />
          </div>

          {trackings.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[11px] text-slate-500 font-bold shrink-0">المناسبات المتاحة:</span>
              {trackings.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSearchQuery(t.trackingCode)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    selectedTracking?.id === t.id
                      ? 'bg-[#155EEF] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.clientName} ({t.trackingCode})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {selectedTracking ? (
            <>
              {/* Status Header Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-l from-slate-50 to-blue-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500">حالة التجهيز الحالية:</span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {selectedTracking.status === 'preparing'
                        ? 'جاري تجهيز المؤن والدلال في المقر'
                        : selectedTracking.status === 'on_the_way'
                        ? 'طاقم الضيافة في الطريق للموقع'
                        : selectedTracking.status === 'setup_ready'
                        ? 'الموقع جاهز والضيافة بدأت'
                        : 'الحجز مؤكد ومجدول'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {selectedTracking.serviceTitle}
                  </h3>
                  <p className="text-xs text-slate-600">
                    حجز باسم: <strong className="text-slate-900">{selectedTracking.clientName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
                  </button>

                  <a
                    href={`/support?text=${encodeURIComponent(
                      `مرحباً، أستفسر عن حالة طلبي رقم ${selectedTracking.trackingCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب المشرف</span>
                  </a>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ ووقت الفعالية</span>
                  </span>
                  <div className="font-bold text-slate-900">{selectedTracking.eventDate}</div>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedTracking.eventTime}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>الموقع والمدينة</span>
                  </span>
                  <div className="font-bold text-slate-900 truncate">{selectedTracking.venueName}</div>
                  <span className="text-[10px] text-slate-500">{selectedTracking.city}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>عدد الضيوف</span>
                  </span>
                  <div className="font-bold font-mono text-slate-900">{selectedTracking.guestCount} شخص</div>
                  <span className="text-[10px] text-emerald-700 font-semibold">طاقم مباشرين مخصص</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>حالة الدفع</span>
                  </span>
                  <div className="font-bold font-mono text-[#155EEF]">
                    {selectedTracking.remainingBalance === 0
                      ? 'مدفوع بالكامل'
                      : `متبقي ${selectedTracking.remainingBalance} ر.س`}
                  </div>
                  <span className="text-[10px] text-slate-500">سداد معتمد ومضمون</span>
                </div>
              </div>

              {/* Live Timeline Stepper */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#155EEF]" />
                    <span>خطوات التنفيذ المباشرة (Live Timeline)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">يتم التحديث الميداني مباشرة</span>
                </div>

                <div className="space-y-4">
                  {selectedTracking.timeline.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-3.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          step.isCompleted
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                            : step.isCurrent
                            ? 'bg-[#155EEF] text-white ring-4 ring-blue-100 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {step.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-mono font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                          <span className="text-[11px] font-mono text-slate-500">{step.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Supervisor Contact Card */}
              {selectedTracking.assignedSupervisor && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {selectedTracking.assignedSupervisor.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        مشرف الضيافة الميداني المعتمد:
                      </span>
                      <h5 className="text-xs font-black text-slate-900">
                        {selectedTracking.assignedSupervisor.name}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedTracking.assignedSupervisor.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 hover:bg-slate-100"
                    >
                      <Phone className="w-3 h-3 text-[#155EEF]" />
                      <span>اتصال مباشر</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Instant Rating & Feedback Box */}
              <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <h4 className="text-xs font-black text-amber-950">
                    تقييم تجربة الضيافة والملاحظات
                  </h4>
                </div>

                {isFeedbackSubmitted ? (
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>شكراً لك! تم استلام تقييمك وملاحظاتك بنجاح وسنعمل بها فوراً.</span>
                  </div>
                ) : (
                  <form onSubmit={handleRatingSubmit} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-700 font-bold">تقييمك:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setClientRating(star)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= clientRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={clientFeedback}
                        onChange={(e) => setClientFeedback(e.target.value)}
                        placeholder="اكتب انطباعك أو أي ملاحظة خاصة لطاقم الضيافة..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-slate-900 focus:outline-none focus:border-amber-400 font-normal"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                      >
                        إرسال التقييم
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">لم يتم العثور على مناسبة برقم التتبع هذا</h4>
              <p className="text-xs text-slate-500">
                يرجى التأكد من كتابة رمز التتبع المكون من 6 خانات أو رقم الجوال بشكل صحيح.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>دعم الضيافة المباشر متاح 24/7</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
