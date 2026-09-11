import React, { useState } from 'react';
import { ClientOrderTracking, VendorBrandSettings } from '../../types';
import { PublicOrderTrackerView } from './PublicOrderTrackerView';
import {
  Clock,
  Share2,
  ExternalLink,
  Code2,
  CheckCircle2,
  Sparkles,
  Phone,
  MessageCircle,
  Copy,
  Plus,
  Eye,
  ShieldCheck,
  Send,
  Zap,
  Terminal,
} from 'lucide-react';

interface VendorOrderTrackerManagerProps {
  trackings: ClientOrderTracking[];
  brandSettings: VendorBrandSettings;
  onUpdateStep: (trackingId: string, stepId: string, isCompleted: boolean) => void;
}

export const VendorOrderTrackerManager: React.FC<VendorOrderTrackerManagerProps> = ({
  trackings,
  brandSettings,
  onUpdateStep,
}) => {
  const [selectedTracking, setSelectedTracking] = useState<ClientOrderTracking>(trackings[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  const activeTrackingUrl = `https://usil.app/track/${selectedTracking.trackingCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeTrackingUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyApiSnippet = () => {
    const snippet = `// 🚀 كود استدعاء API تتبع الطلب المجاني (Free Usil Tracking API)
async function getOrderLiveStatus(trackingCode) {
  const res = await fetch(\`https://usil.app/api/v1/track/\${trackingCode}\`, {
    headers: { 'X-Vendor-Key': 'FREE_TIER_KEY' }
  });
  return await res.json();
}`;
    navigator.clipboard.writeText(snippet);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0A1A33] text-white card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold border border-white/10">
            <Zap className="w-3.5 h-3.5" />
            <span>بوابة تتبع الطلبات المباشرة وAPI المجاني (Free Real-time Tracking Portal)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            تتبع المناسبات المباشر للعميل (مجاناً 100%)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            امنح عملاءك تجربة فندقية فاخرة لمتابعة مراحل التجهيز، تحرك الطاقم، صور الموقع، والتواصل مع المشرف بدون أي تكلفة إضافية وبعلامتك التجارية.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4 text-[#C0A16B]" />
            <span>معاينة شاشة العميل</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedCode ? 'تم نسخ الرابط!' : 'نسخ رابط التتبع للعميل'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Order Tracking Selector + Active Timeline Manager */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left: Trackings List (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              روابط التتبع النشطة ({trackings.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              تحديث فوري
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
            {trackings.map((trk) => {
              const isSelected = selectedTracking.id === trk.id;
              return (
                <div
                  key={trk.id}
                  onClick={() => setSelectedTracking(trk)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#155EEF] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {trk.clientName}
                    </span>
                    <span className="text-[10px] font-mono text-[#155EEF] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {trk.trackingCode}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 truncate mb-2">
                    {trk.serviceTitle}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">{trk.eventDate}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {trk.status === 'preparing' ? 'جاري التجهيز' : 'مؤكد'}
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
                <div className="inline-flex items-center gap-1.5 text-xs text-[#155EEF] font-bold mb-1">
                  <span>المناسبة النشطة:</span>
                  <span className="font-mono">{selectedTracking.trackingCode}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedTracking.clientName} - {selectedTracking.serviceTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  الموعد: {selectedTracking.eventDate} ({selectedTracking.eventTime}) • {selectedTracking.venueName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${selectedTracking.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `مرحباً ${selectedTracking.clientName}،\nيمكنك الآن متابعة تجهيزات مناسبتكم لحظة بلحظة، وتحرك الطاقم الميداني وموقع الفعالية عبر الرابط المباشر:\n${activeTrackingUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>إرسال الرابط للعميل</span>
                </a>
              </div>
            </div>

            {/* Step Checkers for Vendor */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#155EEF]" />
                <span>تحديث مراحل التجهيز الميداني (اضغط لتحديث حالة العميل فورياً)</span>
              </h4>

              <div className="space-y-2.5">
                {selectedTracking.timeline.map((step) => (
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
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{step.title}</span>
                          {step.badgeText && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              {step.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal">{step.description}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 font-semibold bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0">
                      {step.timestamp || 'معلق'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Free API & Embed Snippet Box */}
            <div className="p-4 rounded-2xl bg-[#0A1A33] text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">كود API وتضمين التتبع المجاني لموقعك</span>
                </div>
                <button
                  onClick={handleCopyApiSnippet}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedApi ? 'تم النسخ!' : 'نسخ كود API'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 font-mono text-[11px] text-emerald-300 overflow-x-auto text-left leading-relaxed">
                GET https://usil.app/api/v1/track/{selectedTracking.trackingCode}
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                💡 يمكنك تضمين صفحة التتبع داخل موقعك الخاص مجاناً بدون أي اشتراكات شهرية، ليبقى عميلك مرتبطاً بك طوال الوقت.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Full Client Screen Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 flex items-center justify-center">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Eye className="w-4 h-4" />
                <span>معاينة حية كما يراها العميل على جواله</span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 text-white"
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
