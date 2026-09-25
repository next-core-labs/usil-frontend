import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { ServiceItem } from '../../types';
import {
  X,
  Scale,
  Star,
  Check,
  Plus,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Share2,
  Trash2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Award,
  Filter,
} from 'lucide-react';

interface ServiceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedServices: ServiceItem[];
  allServices: ServiceItem[];
  onRemoveFromCompare: (serviceId: string) => void;
  onAddToCompare: (service: ServiceItem) => void;
  onAddToCart: (service: ServiceItem) => void;
  onOpenDetails: (service: ServiceItem) => void;
  cartItemIds: string[];
  onClearAll: () => void;
}

export const ServiceComparisonModal: React.FC<ServiceComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedServices,
  allServices,
  onRemoveFromCompare,
  onAddToCompare,
  onAddToCart,
  onOpenDetails,
  cartItemIds,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const { formatPrice, currency } = useCurrency();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [isAddingMore, setIsAddingMore] = useState(false);

  if (!isOpen) return null;

  // Available services to add (not yet in compared list)
  const availableToAdd = allServices.filter(
    (s) => !comparedServices.some((cs) => cs.id === s.id)
  );

  // Compute best badges among compared items
  const lowestPrice = Math.min(...comparedServices.map((s) => s.price));
  const highestRating = Math.max(...comparedServices.map((s) => s.rating));
  const maxReviews = Math.max(...comparedServices.map((s) => s.reviewsCount));

  const handleShareWhatsApp = () => {
    if (comparedServices.length === 0) return;
    let text = `🔍 *مقارنة خدمات الضيافة من منصة يوصل (Usil)*\n\n`;
    comparedServices.forEach((s, idx) => {
      text += `${idx + 1}. *${s.title}*\n`;
      text += `   • السعر: ${s.price} ر.س / ${s.priceUnit}\n`;
      text += `   • التقييم: ⭐ ${s.rating} (${s.reviewsCount} تقييم)\n`;
      text += `   • المزود: ${s.provider.name}\n`;
      text += `   • وقت التجهيز: ${s.minNotice}\n\n`;
    });
    text += `يمكنك الاطلاع على كافة التفاصيل والحجز المباشر عبر: https://usil.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-sans usil-modal-scroll">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 flex flex-col overflow-hidden my-auto text-right">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-action/20 border border-action/40 flex items-center justify-center text-action shrink-0">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  جدول مقارنة خدمات الضيافة الفنية
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium font-mono">
                  {comparedServices.length} خدمات
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                قارن الأسعار، التقييمات، ومواصفات التوريد الميدانية لاختيار الأنسب لمناسبتك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Share WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="مشاركة المقارنة عبر واتساب" aria-label="مشاركة المقارنة عبر واتساب"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>

            {/* Clear All */}
            {comparedServices.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="إفراغ المقارنة" aria-label="إفراغ المقارنة"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">مسح الكل</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
             aria-label="إغلاق"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                className="w-4 h-4 rounded text-action focus:ring-blue-500 border-slate-300"
              />
              <span className="font-bold text-slate-700">إظهار الفروقات الجوهرية فقط</span>
            </label>
          </div>

          {comparedServices.length < 4 && availableToAdd.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddingMore(!isAddingMore)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-action" />
                <span>إضافة خدمة للمقارنة ({4 - comparedServices.length} متبقية)</span>
              </button>

              {isAddingMore && (
                <div className="absolute left-0 top-full mt-2 w-72 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                  <div className="text-2xs font-medium text-slate-400 px-2 py-1">
                    اختر خدمة لإضافتها:
                  </div>
                  {availableToAdd.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        onAddToCompare(srv);
                        setIsAddingMore(false);
                      }}
                      className="w-full text-right p-2 rounded-xl hover:bg-blue-50 text-slate-800 flex items-center gap-2.5 transition-colors"
                    >
                      <img
                        src={srv.image}
                        alt={srv.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-medium truncate">{srv.title}</div>
                        <div className="text-2xs text-slate-500 font-mono">
                          {formatPrice(srv.price)} / {srv.priceUnit}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Content Table Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 space-y-6">
          {comparedServices.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Scale className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-800">لم يتم اختيار خدمات للمقارنة بعد</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                يمكنك الضغط على زر "مقارنة" على أي بطاقة خدمة في المنصة لمقارنتها جنباً إلى جنب.
              </p>
            </div>
          ) : (
            <div className="min-w-[700px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              {/* Columns Header: Service Cards */}
              <div className="grid grid-cols-5 bg-slate-900 text-white divide-x divide-x-reverse divide-slate-800 sticky top-0 z-20">
                <div className="p-4 bg-slate-950 font-bold text-sm flex items-center justify-center text-slate-300">
                  <span>المعايير والمواصفات</span>
                </div>
                {comparedServices.map((service) => {
                  const isInCart = cartItemIds.includes(service.id);
                  const isLowest = service.price === lowestPrice && comparedServices.length > 1;
                  const isTopRated = service.rating === highestRating && comparedServices.length > 1;

                  return (
                    <div
                      key={service.id}
                      className="p-4 flex flex-col justify-between space-y-3 relative group"
                    >
                      {/* Delete from comparison button */}
                      <button
                        type="button"
                        onClick={() => onRemoveFromCompare(service.id)}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
                        title="إزالة من المقارنة"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Best value tags */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {isLowest && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-2xs font-medium flex items-center gap-1 shadow-xs">
                            <TrendingDown className="w-3 h-3" />
                            <span>الأفضل سعراً</span>
                          </span>
                        )}
                        {isTopRated && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-2xs font-medium flex items-center gap-1 shadow-xs">
                            <Award className="w-3 h-3" />
                            <span>الأعلى تقييماً</span>
                          </span>
                        )}
                      </div>

                      {/* Image & Title */}
                      <div
                        className="cursor-pointer"
                        onClick={() => onOpenDetails(service)}
                      >
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-24 object-cover rounded-xl mb-2"
                        />
                        <h4 className="font-medium text-xs sm:text-sm text-white line-clamp-2 hover:text-blue-300 transition-colors">
                          {service.title}
                        </h4>
                      </div>

                      {/* Action Button inside column header */}
                      <button
                        type="button"
                        onClick={() => onAddToCart(service)}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          isInCart
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-action hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isInCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>محجوز بالسلة</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>حجز الخدمة</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Empty placeholder column if fewer than 4 */}
                {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="p-6 bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-2"
                  >
                    <Plus className="w-6 h-6 text-slate-600" />
                    <span className="text-xs text-slate-500 font-medium">خانة مقارنة فارغة</span>
                  </div>
                ))}
              </div>

              {/* Rows Comparison */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                
                {/* 1. Price Comparison */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100 bg-blue-50/40">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900 flex items-center gap-1.5">
                    <span>السعر والعملة</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 text-right font-mono">
                      <div className="text-base font-bold text-slate-900">
                        {formatPrice(s.price)}
                      </div>
                      <span className="text-2xs text-slate-500 font-sans">
                        / {s.priceUnit}
                      </span>
                      {s.originalPrice && (
                        <div className="text-2xs text-slate-400 line-through">
                          {formatPrice(s.originalPrice)}
                        </div>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-1-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 2. Rating & Customer Trust */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900 flex items-center gap-1.5">
                    <span>التقييم والموثوقية</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="font-mono text-sm">{s.rating}</span>
                        <span className="text-slate-400 font-normal text-xs">
                          ({s.reviewsCount} تقييم)
                        </span>
                      </div>
                      <div className="text-2xs text-emerald-800 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>موثق بنكياً ومعتمد</span>
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-2-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 3. Provider Details & AI Speed */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>المزوّد وسرعة الرد</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-1 text-xs">
                      <div className="font-bold text-slate-900">{s.provider.name}</div>
                      <div className="text-slate-600 flex items-center gap-1 text-2xs">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>الرد: {s.provider.responseTime}</span>
                      </div>
                      <div className="text-slate-500 text-2xs">
                        {s.provider.completedOrders}+ مناسبة مكتملة بنجاح
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-3-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 4. Minimum Lead Notice Time */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>أقل مهلة للحجز المسبق</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center gap-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{s.minNotice}</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-4-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 5. Geographic Coverage */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>نطاق المدن المغطاة</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 text-xs text-slate-700">
                      <div className="flex items-center gap-1 text-slate-500 mb-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.cities.length} مدن رئيسية</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.cities.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-2xs font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-5-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 6. Technical Features & Highlights */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>المميزات الفنية والتشغيلية</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-1.5">
                      {s.features.map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-slate-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-6-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 7. Package Inclusions */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>ما تشمله الباقة بالتفصيل</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-1 text-2xs text-slate-600">
                      {s.includes.map((inc, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-7-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

                {/* 8. Escrow & Booking Guarantee */}
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-slate-100 bg-slate-50/40">
                  <div className="p-3.5 bg-slate-100/70 font-bold text-slate-900">
                    <span>الضمان المالي وسياسة الإلغاء</span>
                  </div>
                  {comparedServices.map((s) => (
                    <div key={s.id} className="p-3.5 text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-emerald-800">ضمان محفظة الضمان (Escrow)</div>
                      <p className="text-2xs text-slate-500 leading-relaxed">
                        لا يُحول المبلغ للمورّد إلا بعد اكتمال المناسبة ورضا العميل 100%. إلغاء مرن متاح.
                      </p>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - comparedServices.length) }).map((_, idx) => (
                    <div key={`empty-row-8-${idx}`} className="p-3.5 bg-slate-50/50" />
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer Summary / Quick Action */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">💡 نصيحة الخبراء: </span>
            يمكنك حجز خدمات متعددة معاً للحصول على خصومات الباقات المتكاملة وفحص التعارض الآلي.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs"
            >
              إغلاق جدول المقارنة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
