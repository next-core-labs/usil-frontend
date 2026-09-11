import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  Clock,
  Send,
  MessageCircle,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  EyeOff,
  Eye,
  UserCheck,
  ThumbsUp,
  Award,
  ChevronLeft,
  X,
} from 'lucide-react';
import { DoubleBlindReview, VendorBooking } from '../../types';
import { INITIAL_DOUBLE_BLIND_REVIEWS } from '../../data/reviewData';

interface VendorPendingReviewsManagerProps {
  bookings: VendorBooking[];
  onOpenWhatsAppMessage?: (phone: string, text: string) => void;
}

export const VendorPendingReviewsManager: React.FC<VendorPendingReviewsManagerProps> = ({
  bookings,
  onOpenWhatsAppMessage,
}) => {
  const [reviewsList, setReviewsList] = useState<DoubleBlindReview[]>(INITIAL_DOUBLE_BLIND_REVIEWS);
  const [activeReviewModal, setActiveReviewModal] = useState<DoubleBlindReview | null>(null);

  // Form states for vendor rating client
  const [overallRating, setOverallRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [paymentRating, setPaymentRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'عميل راقٍ ومثالي 💎',
    'سداد فوري 💳',
    'تنسيق واستقبال رائع 📍',
  ]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});

  // Filter pending reviews
  const pendingVendorReviews = reviewsList.filter((r) => r.status === 'waiting_vendor');
  const pendingClientReviews = reviewsList.filter((r) => r.status === 'waiting_client');
  const revealedReviews = reviewsList.filter((r) => r.status === 'revealed');

  // Submit vendor review
  const handleSubmitReview = (dbrId: string) => {
    setReviewsList((prev) =>
      prev.map((item) => {
        if (item.id !== dbrId) return item;
        return {
          ...item,
          status: 'revealed' as const,
          revealedAt: new Date().toISOString(),
          vendorReview: {
            overallRating,
            punctualityRating,
            paymentRating,
            clarityRating,
            comment:
              reviewComment ||
              'عميل كريم ومنضبط، سدد كامل المستحقات ونسّق معنا بوضوح ولباقة.',
            tags: selectedTags,
            submittedAt: new Date().toISOString(),
          },
          aiSummary: 'تطابق كامل بين تقييم الطرفين بنسبة 99% مع إشادة بالسداد السريع وحسن الاستقبال وجودة الخدمة.',
          aiTrustMatch: 99,
        };
      })
    );
    setActiveReviewModal(null);
    setReviewComment('');
  };

  // AI Review text generator
  const handleGenerateAIComment = async (clientName: string, serviceTitle: string) => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/gemini/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'vendor',
          partyName: clientName,
          serviceTitle,
          rating: overallRating,
          highlights: 'عميل متعاون وموقع المناسبة مجهز وسداد فوري',
        }),
      });
      const data = await res.json();
      if (data.review) {
        setReviewComment(data.review);
        if (data.tags) setSelectedTags(data.tags);
      }
    } catch (err) {
      setReviewComment(
        `تشرفنا بخدمة الأستاذ ${clientName} في مناسبته. تواصل راقٍ وسلس وتسهيل كامل لدخول طاقم الضيافة وسداد فوري بدون أي تأخير.`
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Automated delayed review reminder sender
  const handleSendDelayedReminder = (item: DoubleBlindReview, recipient: 'client' | 'vendor') => {
    const phone = recipient === 'client' ? item.clientPhone : '0501234567';
    const name = recipient === 'client' ? item.clientName : item.vendorName;
    const msg = `مرحباً ${name} 🌸\nنرجو تذكيركم بإتمام تقييم مناسبة (${item.serviceTitle}) رقم ${item.bookingNumber} على منصة يوصل.\nالتقييم محمي بنظام (التقييم الأعمى المزدوج) ولن يظهر للطرف الآخر حتى يكتمل التقييم من كلاكما.\nرابط التقييم المباشر: https://usil.app/reviews/${item.id}`;

    setRemindedIds((prev) => ({ ...prev, [item.id]: true }));

    if (onOpenWhatsAppMessage) {
      onOpenWhatsAppMessage(phone, msg);
    } else {
      window.open(`https://wa.me/966${phone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0A1A33] via-[#0F284D] to-[#155EEF] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
            <ShieldCheck className="w-4 h-4 text-[#C0A16B]" />
            <span>نظام التقييم المزدوج الأعمى (Two-Sided Double Blind Reviews)</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">إدارة تقييمات الطلبات المكتملة والتذكير الآلي</h3>
          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            لضمان المصداقية ومنع التقييمات الانتقامية، تبقى آراء الطرفين سرية ومشفرة تماماً حتى يكتب كلاكما تقييمه، لتكشف المنصة النتيجة تلقائياً مع تحليل الذكاء الاصطناعي.
          </p>
        </div>

        {/* Counter Stats */}
        <div className="flex gap-2.5 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-center">
            <span className="text-[11px] text-amber-200 block font-bold">بانتظار تقييمك</span>
            <span className="text-xl font-black text-white font-mono">{pendingVendorReviews.length}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-center">
            <span className="text-[11px] text-blue-200 block font-bold">بانتظار العميل</span>
            <span className="text-xl font-black text-white font-mono">{pendingClientReviews.length}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-center">
            <span className="text-[11px] text-emerald-200 block font-bold">مكتملة ومكشوفة</span>
            <span className="text-xl font-black text-white font-mono">{revealedReviews.length}</span>
          </div>
        </div>
      </div>

      {/* 1. Urgent: Completed Orders Waiting for YOUR (Vendor) Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h4 className="font-extrabold text-slate-900 text-base">
              طلبات مكتملة بانتظار تقييمك للعميل ({pendingVendorReviews.length})
            </h4>
          </div>
          <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-bold">
            العميل أرسل تقييمه بالفعل ومقفول بنظام الحجب الأعمى 🔒
          </span>
        </div>

        {pendingVendorReviews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">ممتاز! لا توجد طلبات معلقة بانتظار تقييمك</p>
            <p className="text-slate-400 mt-1">لقد قمت بتقييم جميع عملائك الكرام بانتظام.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVendorReviews.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                      {item.bookingNumber}
                    </span>
                    <h5 className="font-extrabold text-slate-900 text-sm mt-1">{item.serviceTitle}</h5>
                    <p className="text-xs text-slate-500">تاريخ المناسبة: {item.eventDate}</p>
                  </div>

                  <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>تقييم العميل محجوب</span>
                  </div>
                </div>

                {/* Client Profile Snippet */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.clientAvatar}
                      alt={item.clientName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h6 className="font-bold text-xs text-slate-900">{item.clientName}</h6>
                      <span className="text-[10px] text-[#155EEF] font-bold">{item.clientBadge}</span>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs font-black text-slate-800">⭐ {item.clientRating}</span>
                  </div>
                </div>

                {/* Blind Locked Notice */}
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <EyeOff className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span>العميل كتب تقييمه وسلّم رأيه في {item.clientReview?.submittedAt}</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    قيّم العميل الآن ليتم فك الحجب فوراً وظهور التقييمين معاً على ملفك وملف العميل.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActiveReviewModal(item);
                      handleGenerateAIComment(item.clientName, item.serviceTitle);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A1A33] hover:bg-[#101828] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Star className="w-4 h-4 text-[#C0A16B] fill-[#C0A16B]" />
                    <span>تقييم العميل الآن وفك الحجب</span>
                  </button>

                  <button
                    onClick={() => handleSendDelayedReminder(item, 'client')}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                    title="إرسال رسالة تذكير للعميل"
                  >
                    <Bell className="w-3.5 h-3.5 text-slate-600" />
                    <span>تذكير</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Pending Client Reviews (Vendor evaluated, Client hasn't submitted yet) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-slate-900 text-base">
              طلبات مكتملة بانتظار تقييم العميل ({pendingClientReviews.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            يمكنك إرسال تذكير آلي بنقرة واحدة عبر الواتساب
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingClientReviews.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {item.bookingNumber}
                  </span>
                  <h5 className="font-extrabold text-slate-900 text-sm mt-1">{item.serviceTitle}</h5>
                  <p className="text-xs text-slate-500">العميل: {item.clientName}</p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>أنت قيّمت العميل ✅</span>
                </span>
              </div>

              {/* Status Explanation */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">بانتظار رد العميل: {item.clientName}</span>
                  <span className="text-[11px] text-slate-400">
                    رقم الجوال: {item.clientPhone}
                  </span>
                </div>
                {remindedIds[item.id] ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    تم إرسال التذكير بنجاح ✓
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendDelayedReminder(item, 'client')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تذكير آلي عبر واتساب</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Revealed & Completed Double Blind Reviews */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <h4 className="font-extrabold text-slate-900 text-base">
              التقييمات المزدوجة المكتملة والمكشوفة ({revealedReviews.length})
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          {revealedReviews.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    {item.bookingNumber} • مكشوف ومعتمد ✓
                  </span>
                  <h5 className="font-extrabold text-slate-900 text-base mt-1">{item.serviceTitle}</h5>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    توافق التقييمين: {item.aiTrustMatch}% 🛡️
                  </span>
                </div>
              </div>

              {/* Two-Sided Review Cards Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client's Review of Vendor */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.clientAvatar}
                        alt={item.clientName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{item.clientName}</span>
                        <span className="text-[10px] text-slate-500">تقييم العميل لخدمتكم</span>
                      </div>
                    </div>
                    <div className="flex text-amber-500 text-xs">
                      {'⭐'.repeat(item.clientReview?.overallRating || 5)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    "{item.clientReview?.comment}"
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.clientReview?.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-blue-900 border border-blue-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vendor's Review of Client */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.vendorAvatar}
                        alt={item.vendorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{item.vendorName} (أنت)</span>
                        <span className="text-[10px] text-slate-500">تقييمك للعميل</span>
                      </div>
                    </div>
                    <div className="flex text-amber-500 text-xs">
                      {'⭐'.repeat(item.vendorReview?.overallRating || 5)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    "{item.vendorReview?.comment}"
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.vendorReview?.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Consensus Summary */}
              {item.aiSummary && (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-start gap-2 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ملخص الذكاء الاصطناعي للمطابقة:</span>
                    <p className="text-[11px] text-amber-800">{item.aiSummary}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Modal for Vendor */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs text-right usil-modal-scroll">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0A1A33] to-[#155EEF] p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-base text-white">تقييم العميل: {activeReviewModal.clientName}</h4>
                <p className="text-xs text-slate-200 mt-0.5">طلب: {activeReviewModal.serviceTitle}</p>
              </div>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">
              {/* Star Rating Dimensions */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">التقييم العام للعميل:</span>
                  <div className="flex gap-1 text-amber-500 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setOverallRating(star)}
                        className={`w-5 h-5 ${
                          star <= overallRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-600">التزام بالسداد الفوري:</span>
                  <div className="flex gap-1 text-amber-500 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setPaymentRating(star)}
                        className={`w-4 h-4 ${
                          star <= paymentRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-600">جاهزية الموقع والوقت:</span>
                  <div className="flex gap-1 text-amber-500 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setPunctualityRating(star)}
                        className={`w-4 h-4 ${
                          star <= punctualityRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Comment Generator */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">رأيك وتجربتك مع العميل</label>
                <button
                  type="button"
                  onClick={() => handleGenerateAIComment(activeReviewModal.clientName, activeReviewModal.serviceTitle)}
                  disabled={isGeneratingAI}
                  className="text-[11px] font-bold text-[#155EEF] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#155EEF]" />
                  <span>{isGeneratingAI ? 'جارٍ الصياغة بالذكاء الاصطناعي...' : 'صياغة احترافية بالـ AI'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اكتب تقييمك للعميل (مثال: عميل راقٍ وموقع القاعة كان مجهزاً مسبقاً وسداد فوري)..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#155EEF] focus:outline-none leading-relaxed"
              />

              {/* Submit Action */}
              <button
                onClick={() => handleSubmitReview(activeReviewModal.id)}
                className="w-full py-3 rounded-xl bg-[#0A1A33] hover:bg-[#101828] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>إرسال التقييم وفك الحجب المتبادل</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
