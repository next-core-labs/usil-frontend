import React, { useState } from 'react';
import { ServiceItem } from '../types';
import { X, Star, CheckCircle2, ShieldCheck, MapPin, Clock, MessageCircle, ShoppingBag, Check, AlertTriangle, Calendar, Scale, ChefHat } from 'lucide-react';
import { BookingTrustBox } from './BookingTrustBox';
import { AUDIENCE_LABEL, FULFILLMENT_LANE_BY_ID } from '../data/saudiMarket';
import { listingPhotoUrls } from '../utils/catalogMedia';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { VendorSocialIcons } from './vendor/VendorSocialIcons';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onAddToCart: (service: ServiceItem, quantity: number, date: string, time: string, city: string, notes: string) => void;
  isInCart: boolean;
  onToggleCompare?: (service: ServiceItem) => void;
  isCompared?: boolean;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onAddToCart,
  isInCart,
  onToggleCompare,
  isCompared = false,
}) => {
  if (!service) return null;

  const images = listingPhotoUrls(service);
  const [activeImage, setActiveImage] = useState(images[0] || '');
  const [quantity, setQuantity] = useState(service.minQuantity || 1);
  const [selectedCity, setSelectedCity] = useState(service.cities[0] || 'الرياض');
  const [eventDate, setEventDate] = useState('2026-08-28');
  const [eventTime, setEventTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const totalPrice = service.price * quantity;
  const needsVendorApproval = service.bookingMode === 'approval';

  // Real-time conflict & availability check (Airbnb-style)
  const isDateFullyBooked = false;

  const handleBooking = () => {
    if (isDateFullyBooked) {
      alert('عذراً، هذا التاريخ محجوز بالكامل أو مغلق للصيانة لدى المورّد. يرجى اختيار تاريخ آخر لتجنب أي تعارض.');
      return;
    }
    onAddToCart(service, quantity, eventDate, eventTime, selectedCity, notes);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1000);
  };

  const handleAskSupport = () => {
    window.location.href = '/support';
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl dropdown-shadow overflow-hidden z-10 my-auto text-right max-h-[95vh] sm:max-h-none">
        
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
              {service.categoryName}
            </span>
            {(service.fulfillment || []).map((lane) => (
              <span
                key={lane}
                className="px-3 py-1 rounded-lg bg-[#155EEF] text-white text-xs font-bold"
              >
                {FULFILLMENT_LANE_BY_ID[lane]?.chip || lane}
              </span>
            ))}
            {service.badge && (
              <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                {service.badge}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
              <span className="hidden sm:inline">نظام حماية عدم التعارض</span><span className="sm:hidden">حماية</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(service)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isCompared
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isCompared ? 'ضمن المقارنة' : 'مقارنة'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-7 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column (Images & Inclusions) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Active Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              {activeImage ? (
                <img src={activeImage} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                  بدون صورة من المورّد
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImage === img ? 'border-[#155EEF]' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Provider Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0A1A33] text-[#C0A16B] flex items-center justify-center font-bold text-base shadow-xs">
                  {service.provider.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm flex-wrap">
                    <span>{service.provider.name}</span>
                    {service.provider.verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>موثّق</span>
                      </span>
                    ) : null}
                    {service.licensedKitchen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black border border-amber-200">
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>مطبخ مرخّص</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {service.provider.completedOrders} مناسبة منفذة بنجاح • عقد إلكتروني موثق يحفظ حقوق الطرفين
                  </div>
                  <div className="mt-2">
                    <VendorSocialIcons links={service.provider.socials} />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-slate-900 font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{service.provider.rating}</span>
                </div>
              </div>
            </div>

            {/* Inclusions List */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
                <span>مشتملات وتجهيزات الخدمة</span>
              </h4>
              <ul className="space-y-2">
                {service.includes.map((item, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column (Booking Form & Price Breakdown) */}
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {service.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                  {service.fullDesc}
                </p>
                {service.occasions && service.occasions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {service.audience && AUDIENCE_LABEL[service.audience] ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#0A1A33] text-white text-[10px] font-bold">
                        {AUDIENCE_LABEL[service.audience]}
                      </span>
                    ) : null}
                    {service.occasions.slice(0, 4).map((occ) => (
                      <span key={occ} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        {occ}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700 font-semibold">
                  <Clock className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <span>الطلب قبل: {service.minNotice}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700 font-semibold">
                  <MapPin className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <span>التغطية: {service.cities.length} مدن</span>
                </div>
              </div>

              {/* Booking Configurator Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-900">
                  تخصيص تفاصيل مناسبتك وفحص التوفر الفوري
                </h4>

                {/* City selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    مدينة المناسبة
                  </label>
                  <PlaceSearchSelect
                    value={selectedCity}
                    onChange={setSelectedCity}
                    includeAll={false}
                    boxed
                    aria-label="مدينة المناسبة"
                  />
                </div>

                {/* Date & Time with Airbnb-style Conflict Checker */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تاريخ المناسبة
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      aria-label="تاريخ المناسبة"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-[#155EEF] focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      وقت التجهيز / البدء
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      aria-label="وقت التجهيز أو البدء"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-[#155EEF] focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                {/* Conflict Status Feedback */}
                {eventDate && (
                  <div>
                    {isDateFullyBooked ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>تنبيه: هذا الموعد محجوز بالكامل أو مغلق للصيانة</span>
                        </div>
                        <p className="text-[11px] text-rose-800 font-normal">
                          نظام منع التعارض يحظر الحجز المزدوج. يرجى اختيار يوم آخر (مثل 2026-08-28 أو 2026-08-30).
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ التاريخ متاح وجاهز للحجز الفوري بدون أي تعارض.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-bold text-slate-700">
                    الكمية ({service.priceUnit})
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max((service.minQuantity || 1), quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-900 text-sm min-w-[2.5rem] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    متطلبات إضافية أو ملاحظات خاصة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: الحضور قبل الموعد بساعة، ترتيبات أزياء..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-[#155EEF] focus:outline-none font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="space-y-3 pt-2">
              <BookingTrustBox services={[service]} totalGross={totalPrice} />

              <div
                className={`p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed ${
                  needsVendorApproval
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {needsVendorApproval
                  ? 'طريقة تأكيد الحجز: بموافقة المورّد — طلبك يوصل للمورّد ويصير «بانتظار موافقة المورّد» قبل ما يتأكد.'
                  : 'طريقة تأكيد الحجز: حجز فوري — حجزك يتأكد مباشرة بدون انتظار موافقة المورّد.'}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isDateFullyBooked}
                  onClick={handleBooking}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors ${
                    isDateFullyBooked
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white'
                  }`}
                >
                  {isInCart ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>
                    {isInCart ? 'تحديث المناسبة' : needsVendorApproval ? 'اطلب الحجز' : 'احجز الآن'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleAskSupport}
                  className="py-3 px-4 rounded-xl bg-[#0A1A33] hover:bg-[#101828] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#C0A16B]" />
                  <span>راسل دعم يوصل</span>
                </button>
              </div>

              {showSuccessToast && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold">
                  ✓ تم إضافة الخدمة وتثبيت الموعد بنجاح
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

