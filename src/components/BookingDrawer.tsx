import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingItem, ClientOrderTracking } from '../types';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { saveDraftBookingForm, loadDraftBookingForm } from '../utils/storage';
import { BookingTrustBox } from './BookingTrustBox';
import { hasCheckoutPrice } from '../utils/catalogMedia';
import { normalizeSaudiMobile } from '../contracts/shared/booking-guards';
import {
  X,
  Trash2,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BookingItem[];
  onUpdateQuantity: (serviceId: string, delta: number) => void;
  onRemoveItem: (serviceId: string) => void;
  onClearCart: () => void;
  onCompleteOnlineBooking?: (
    bookingDetails: {
      customerName: string;
      customerPhone: string;
      eventDate: string;
      eventCity: string;
      notes: string;
      paymentMethod: 'moyasar';
      totalAmount: number;
    }
  ) => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOnlineBooking,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [eventCity, setEventCity] = useState('الرياض');
  const [generalNotes, setGeneralNotes] = useState('');
  const paymentMethod = 'moyasar' as const;
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Restore draft booking form inputs from localforage
  useEffect(() => {
    async function restoreDraft() {
      const draft = await loadDraftBookingForm();
      if (draft) {
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerPhone) setCustomerPhone(draft.customerPhone);
        if (draft.eventCity) setEventCity(draft.eventCity);
        if (draft.eventDate) setEventDate(draft.eventDate);
        if (draft.generalNotes) setGeneralNotes(draft.generalNotes);
      }
    }
    restoreDraft();
  }, []);

  // Auto-save draft booking form inputs to localforage on changes
  useEffect(() => {
    saveDraftBookingForm({
      customerName,
      customerPhone,
      eventDate,
      eventCity,
      generalNotes,
      paymentMethod,
    });
  }, [customerName, customerPhone, eventDate, eventCity, generalNotes, paymentMethod]);

  const totalAmount = items.reduce((sum, item) => {
    return sum + item.service.price * item.quantity;
  }, 0);

  // يكفي منتج واحد «بموافقة المورّد» حتى ينتظر الطلب كامل الموافقة.
  const needsVendorApproval = items.some((item) => item.service.bookingMode === 'approval');

  const openMoyasarCheckout = (url: string) => {
    const host = new URL(url, window.location.origin).hostname.toLowerCase();
    if (host === 'moyasar.com' || host.endsWith('.moyasar.com')) {
      window.location.assign(url);
      return true;
    }
    return false;
  };

  const startPayment = async (amountSar: number, description: string, orderId: string) => {
    const res = await fetch('/api/payments/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount: amountSar,
        description,
        metadata: { order_id: orderId, bookingId: orderId },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
    if (!res.ok) throw new Error(data.error ?? 'تعذّر بدء الدفع');
    const url = String(data.url || '');
    if (!openMoyasarCheckout(url)) {
      throw new Error('رابط الدفع من ميسر غير صالح. لم نفتح أي رابط خارج ميسر.');
    }
  };

  const handleConfirmOrder = async () => {
    const saudiPhone = normalizeSaudiMobile(customerPhone);
    if (!customerName.trim() || !saudiPhone) {
      setSubmitError('اكتب الاسم وجوال سعودي صحيح (05xxxxxxxx) لتأكيد الطلب والدفع.');
      return;
    }

    setSubmitError(null);
    setIsProcessingPayment(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: customerName,
          phone: saudiPhone,
          serviceId: items[0]?.service.id,
          serviceName: items.map((item) => item.service.title).join(' + '),
          notes: generalNotes,
          city: eventCity,
          eventDate,
          paymentMethod: 'moyasar',
          totalAmount,
          items: items.map((item) => ({
            id: item.service.id,
            title: item.service.title,
            quantity: item.quantity,
            price: item.service.price,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || 'تعذر حفظ الطلب. حاول مرة أخرى.');
        return;
      }
      const generatedCode = data.booking?.id || `USIL-${Math.floor(100000 + Math.random() * 900000)}`;
      const payUrl = String(data.booking?.paymentUrl || '');
      if (payUrl) {
        try {
          if (openMoyasarCheckout(payUrl)) return;
        } catch {
          setSubmitError('رابط الدفع من ميسر غير صالح. لم نفتح أي رابط خارج ميسر.');
          return;
        }
        setSubmitError('رابط الدفع من ميسر غير صالح. لم نفتح أي رابط خارج ميسر.');
        return;
      }
      try {
        await startPayment(
          totalAmount,
          `طلب يوصل ${generatedCode} — ${items.map((item) => item.service.title).join(' + ')}`,
          generatedCode,
        );
        return;
      } catch (error) {
        setSubmitError((error as Error).message || 'تعذّر بدء الدفع الإلكتروني.');
        return;
      }
    } catch {
      setSubmitError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] overflow-hidden text-right font-sans pointer-events-auto">
        {/* Backdrop with Fade */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Drawer Container (Bottom Sheet on Mobile, Left Drawer on Desktop) */}
        <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-0 md:right-auto max-w-full flex">
          <motion.div 
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              // Swipe down gesture to dismiss drawer
              if (info.offset.y > 140 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="w-full md:w-screen md:max-w-lg max-h-[90vh] md:max-h-full bg-white rounded-t-3xl md:rounded-none md:border-r border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden touch-pan-y"
          >
            {/* Mobile Drag Indicator Handle */}
            <div className="md:hidden pt-3 pb-1 flex justify-center bg-slate-50 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0A1A33] text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4 text-[#C0A16B]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">سلة حجز وترتيب المناسبة</h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {items.length} خدمات مضافة • منصة يوصل (Usil)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && !completedOrderCode && (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onClearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors p-1 cursor-pointer"
                  >
                    إفراغ السلة
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Cart Content or Success State */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              {completedOrderCode ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900">تم تسجيل طلبك في يوصل</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      بنحوّلك لصفحة الدفع الإلكتروني عند ميسر (مدى / آبل باي / STC Pay).
                    </p>
                    <p
                      className={`text-[11px] font-bold max-w-sm mx-auto ${
                        needsVendorApproval ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {needsVendorApproval
                        ? 'حالة الطلب: بانتظار موافقة المورّد — بنبلغك أول ما يقبل المورّد.'
                        : 'حالة الطلب: مؤكد — حجز فوري بدون انتظار موافقة.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 max-w-sm mx-auto space-y-2 text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">رمز التتبع المباشر للطلب:</span>
                    <div className="text-lg font-mono font-black text-[#155EEF] bg-white p-2.5 rounded-xl border border-blue-200 text-center tracking-widest">
                      {completedOrderCode}
                    </div>
                    <p className="text-[10px] text-slate-600">
                      يمكنك متابعة تحرك الطاقم ووصول الموقع لحظة بلحظة عبر بوابة التتبع المباشرة.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        onClearCart();
                      }}
                      className="w-full py-3 rounded-xl bg-[#0A1A33] hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      متابعة التتبع وإغلاق السلة
                    </motion.button>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-base">سلة الترتيبات فارغة حالياً</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-normal leading-relaxed">
                    اختر مورّدًا من السوق — عرس، تخرج، مؤتمر، أو ضيافة — ثم احجز بسعر نهائي يشمل الضريبة.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    استعراض الخدمات المتاحة
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={item.service.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {item.service.image ? (
                            <img
                              src={item.service.image}
                              alt={item.service.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                          ) : null}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.service.title}
                            </h4>
                            <span className="text-[11px] text-slate-700 font-bold block mt-0.5 font-mono">
                              {hasCheckoutPrice(item.service.price)
                                ? `${item.service.price.toLocaleString('ar-SA')} ر.س / ${item.service.priceUnit}`
                                : 'بدون سعر'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.city || 'الرياض'}
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => onRemoveItem(item.service.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => onUpdateQuantity(item.service.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold hover:bg-slate-100 cursor-pointer"
                            >
                              -
                            </motion.button>
                            <span className="text-xs font-bold text-slate-900 px-2 font-mono">
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => onUpdateQuantity(item.service.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold hover:bg-slate-100 cursor-pointer"
                            >
                              +
                            </motion.button>
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {hasCheckoutPrice(item.service.price)
                              ? `${(item.service.price * item.quantity).toLocaleString('ar-SA')} ر.س`
                              : '—'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Event Details Form */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">بيانات صاحب المناسبة والموقع</h4>

                    <div>
                      <label className="block text-[11px] text-slate-700 font-bold mb-1">الاسم الكريم *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="اسم صاحب الحجز / الجهة"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-[#155EEF] focus:outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-700 font-bold mb-1">جوال سعودي لتأكيد الطلب والدفع *</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-[#155EEF] focus:outline-none font-mono font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-700 font-bold mb-1">المدينة</label>
                        <PlaceSearchSelect
                          value={eventCity}
                          onChange={setEventCity}
                          includeAll={false}
                          boxed
                          aria-label="مدينة المناسبة"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-700 font-bold mb-1">تاريخ المناسبة</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          aria-label="تاريخ المناسبة"
                          className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:border-[#155EEF] focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-700 font-bold mb-1">ملاحظات أو توجيهات خاصة</label>
                      <input
                        type="text"
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        placeholder="أوقات معينة، لون الثياب، موقع القاعة..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-[#155EEF] focus:outline-none font-normal"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">تأكيد الطلب والدفع</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {hasCheckoutPrice(totalAmount)
                        ? 'التأكيد على جوالك السعودي 05xxxxxxxx. الدفع إلكتروني عبر ميسر: مدى، آبل باي، أو STC Pay. البطاقة تبقى عند ميسر.'
                        : 'التأكيد على جوالك السعودي. الدفع عبر ميسر بعد ما المورّد يثبّت السعر الحقيقي. ما نخصم مبلغ تجريبي.'}
                    </p>

                    <div className="p-3 rounded-xl border border-[#155EEF] bg-[#155EEF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>دفع إلكتروني — مدى / آبل باي / STC Pay</span>
                    </div>
                    <p
                      className={`p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed ${
                        needsVendorApproval
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      {needsVendorApproval
                        ? 'طريقة تأكيد الحجز: بموافقة المورّد — الطلب يبدأ «بانتظار موافقة المورّد» لين يقبله المورّد.'
                        : 'طريقة تأكيد الحجز: حجز فوري — الطلب يتأكد مباشرة بدون انتظار موافقة.'}
                    </p>
                    {submitError ? (
                      <p className="text-[11px] text-rose-700 font-bold">{submitError}</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {/* Footer & Checkout */}
            {items.length > 0 && !completedOrderCode && (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3 safe-area-pb">
                <BookingTrustBox
                  services={items.map((item) => item.service)}
                  totalGross={totalAmount}
                  compact
                />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 rounded-xl bg-[#0A1A33] hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ تثبيت الطلب...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-[#C0A16B]" />
                      <span>
                        {needsVendorApproval ? 'اطلب الحجز وادفع إلكترونياً' : 'احجز الآن — دفع إلكتروني'}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

