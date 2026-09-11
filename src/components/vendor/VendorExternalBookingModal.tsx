import React, { useState, useEffect } from 'react';
import { VendorBooking, BlockedDate, BookingSource, CrewMember } from '../../types';
import { PlaceSearchSelect } from '../PlaceSearchSelect';
import type { VendorListing } from '../../contracts/vendors/vendor-listings';
import {
  X,
  Plus,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  PhoneCall,
  Instagram,
  Globe,
  Sparkles,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

interface VendorExternalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBooking: (newBooking: Omit<VendorBooking, 'id' | 'bookingNumber' | 'createdAt'>) => void;
  existingBookings: VendorBooking[];
  blockedDates: BlockedDate[];
  crewMembers: CrewMember[];
  initialDate?: string;
  listings?: VendorListing[];
}

export const VendorExternalBookingModal: React.FC<VendorExternalBookingModalProps> = ({
  isOpen,
  onClose,
  onSaveBooking,
  existingBookings,
  blockedDates,
  crewMembers,
  initialDate = '2026-08-25',
  listings = [],
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [source, setSource] = useState<BookingSource>('external_phone');
  const [serviceId, setServiceId] = useState(listings[0]?.id || '');
  const [customServiceTitle, setCustomServiceTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [city, setSelectedCity] = useState('الرياض');
  const [venueName, setVenueName] = useState('');
  const [guestCount, setGuestCount] = useState(100);
  const [totalAmount, setTotalAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [assignedCrew, setAssignedCrew] = useState<string[]>([]);

  const selectedServiceObj = listings.find((s) => s.id === serviceId);

  useEffect(() => {
    if (selectedServiceObj) {
      if (selectedServiceObj.priceUnit === 'للشخص') {
        setTotalAmount(selectedServiceObj.price * guestCount);
      } else {
        setTotalAmount(selectedServiceObj.price);
      }
    }
  }, [serviceId, guestCount, selectedServiceObj]);

  // Live Conflict Checking
  const isDateBlocked = blockedDates.some((b) => b.date === date);
  const conflictingBookings = existingBookings.filter((b) => b.date === date);
  const hasConflict = isDateBlocked || conflictingBookings.length > 0;

  const handleToggleCrew = (crewId: string) => {
    setAssignedCrew((prev) =>
      prev.includes(crewId) ? prev.filter((id) => id !== crewId) : [...prev, crewId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !date) return;

    onSaveBooking({
      serviceId,
      serviceTitle: selectedServiceObj?.title || customServiceTitle.trim() || 'خدمة من المورّد',
      customerName,
      customerPhone: customerPhone || 'غير محدد',
      date,
      startTime,
      endTime,
      city,
      venueName: venueName || 'موقع العميل الخاص',
      guestCount,
      totalAmount: Number(totalAmount),
      depositAmount: Number(depositAmount),
      remainingAmount: Math.max(0, Number(totalAmount) - Number(depositAmount)),
      source,
      status: 'confirmed',
      notes,
      assignedCrew,
      hasConflict,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 usil-modal-scroll">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl dropdown-shadow overflow-hidden z-10 my-auto text-right">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>تسجيل حجز مركزي في التقويم</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              تسجيل حجز خارجي (اتصال / إنستقرام / واتساب)
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              أضف حجوزاتك الخارجية لحظر الموعد تلقائياً في المنصة ومنع التعارض مع العملاء الآخرين.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Live Conflict Warning Banner */}
          {hasConflict ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>تنبيه تقويم: تاريخ ({date}) لديه ارتباطات مسبقة!</span>
              </div>
              <p className="text-amber-800 font-normal leading-relaxed">
                {isDateBlocked
                  ? 'هذا التاريخ مسجل كيوم محظور/صيانة في جدولك.'
                  : `لديك بالفعل ${conflictingBookings.length} مناسبات مسجلة في هذا التاريخ. تأكد من توفر طاقم ومعدات كافية.`}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>الموعد متاح بالكامل وجاهز للحجز والتثبيت بدون أي تعارض.</span>
            </div>
          )}

          {/* Section 1: Client & Source */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. بيانات العميل ومصدر الحجز
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم العميل</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: تركي الشمري"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#155EEF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-[#155EEF] focus:bg-white"
                />
              </div>
            </div>

            {/* Booking Source Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">مصدر الطلب</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'external_phone', label: 'مكالمة اتصال', icon: PhoneCall },
                  { id: 'external_instagram', label: 'إنستقرام / تيك توك', icon: Instagram },
                  { id: 'external_whatsapp', label: 'واتساب مباشر', icon: PhoneCall },
                  { id: 'direct_bio_link', label: 'رابط البايو', icon: Globe },
                ].map((s) => {
                  const Icon = s.icon;
                  const isSel = source === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSource(s.id as BookingSource)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-[#0A1A33] border-[#0A1A33] text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Service & Event Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. تفاصيل الخدمة والجدولة
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الخدمة المطلوبة</label>
              {listings.length > 0 ? (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#155EEF]"
                >
                  {listings.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — ({s.price} ر.س {s.priceUnit})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customServiceTitle}
                  onChange={(e) => setCustomServiceTitle(e.target.value)}
                  placeholder="اسم منتجك الحقيقي (ما نستخدم كتالوج وهمي)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#155EEF]"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">تاريخ المناسبة</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#155EEF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">وقت البدء</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#155EEF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">وقت الانتهاء</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#155EEF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المدينة</label>
                <PlaceSearchSelect
                  value={city}
                  onChange={setSelectedCity}
                  includeAll={false}
                  boxed
                  aria-label="المدينة"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الموقع / اسم القاعة</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="مثال: قاعة الخزامى"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#155EEF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">عدد الضيوف</label>
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#155EEF]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Deposits */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. المبالغ والعربون المحصّل
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] text-slate-500 font-bold mb-1">المبلغ الإجمالي</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs font-mono"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">ر.س</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] text-slate-500 font-bold mb-1">العربون المسدد</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-900 text-xs font-mono"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">ر.س</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                <span className="text-[11px] text-slate-500 font-bold">المتبقي عند التنفيذ</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {Math.max(0, totalAmount - depositAmount).toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Assign Crew */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. تعيين طاقم العمل الميداني للمناسبة
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {crewMembers.map((c) => {
                const isSelected = assignedCrew.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleCrew(c.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-[#155EEF] text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <img src={c.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{c.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Custom Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ملاحظات تجهيز أو متطلبات خاصة
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: زيادة دلال قهوة هيل زائد، وصول الطاقم قبل الموعد بساعة..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#155EEF] font-normal"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>تثبيت الحجز وقفل التاريخ في التقويم</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
            >
              إلغاء
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
