import React, { useState } from 'react';
import { VendorBooking, BlockedDate } from '../../types';
import { VendorConflictBadge } from './VendorConflictBadge';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Copy,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface VendorCalendarViewProps {
  bookings: VendorBooking[];
  blockedDates: BlockedDate[];
  onOpenExternalBookingModal: (prefillDate?: string) => void;
  onAddBlockedDate: (date: string, reason: string, type: BlockedDate['type']) => void;
  onRemoveBlockedDate: (id: string) => void;
}

export const VendorCalendarView: React.FC<VendorCalendarViewProps> = ({
  bookings,
  blockedDates,
  onOpenExternalBookingModal,
  onAddBlockedDate,
  onRemoveBlockedDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-22');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(7); // August (0-indexed: 7)
  const [currentYear, setCurrentYear] = useState(2026);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState<BlockedDate['type']>('maintenance');
  const [blockInputDate, setBlockInputDate] = useState('2026-08-26');
  const [copiedICal, setCopiedICal] = useState(false);

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Helper to generate days of the month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 is Sunday

  // Days array
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const formattedMonth = String(currentMonthIndex + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

    const dayBookings = bookings.filter((b) => b.date === dateStr);
    const dayBlocked = blockedDates.find((b) => b.date === dateStr);
    const hasConflict = dayBookings.length > 1; // Double booking alert

    return {
      dayNumber,
      dateStr,
      bookings: dayBookings,
      isBlocked: !!dayBlocked,
      blockedInfo: dayBlocked,
      hasConflict,
    };
  });

  const selectedDayData = days.find((d) => d.dateStr === selectedDate);
  const selectedDayBookings = bookings.filter((b) => b.date === selectedDate);
  const selectedDayBlocked = blockedDates.find((b) => b.date === selectedDate);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const handleCopyICal = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/vendor/calendar.ics`);
    setCopiedICal(true);
    setTimeout(() => setCopiedICal(false), 2000);
  };

  const handleConfirmBlockDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockInputDate) return;
    onAddBlockedDate(blockInputDate, blockReason || 'تاريخ محظور يدوياً', blockType);
    setShowBlockModal(false);
    setBlockReason('');
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Banner & Control Actions */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-action" />
            <span>نظام منع تعارض الحجوزات الذكي (Airbnb-Style Availability Engine)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            التقويم المركزي الموحد ومزامنة الحجوزات
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            إدارة كافة الحجوزات الميدانية (من المنصة، الاتصالات، إنستقرام، والواتساب) في مكان واحد لمنع الازدواجية وإغلاق التواريخ المحجوزة تلقائياً.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <button
            onClick={() => onOpenExternalBookingModal(selectedDate)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل حجز خارجي جديد</span>
          </button>

          <button
            onClick={() => {
              setBlockInputDate(selectedDate);
              setShowBlockModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4 text-slate-600" />
            <span>حظر تاريخ / إجازة</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day Details on Right */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6">
          
          {/* Month Navigator Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm">
                <CalendarIcon className="w-4 h-4 text-sand" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {monthNames[currentMonthIndex]} {currentYear}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="الشهر السابق"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonthIndex(7);
                  setCurrentYear(2026);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition-colors"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="الشهر التالي"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for starting offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 sm:h-28 rounded-2xl bg-slate-50/40 border border-transparent" />
            ))}

            {/* Real Days */}
            {days.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const hasBookings = day.bookings.length > 0;
              const isBlocked = day.isBlocked;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`h-24 sm:h-28 p-2 rounded-2xl border text-right cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-action ring-2 ring-action/20'
                      : isBlocked
                      ? 'bg-slate-100/90 border-slate-300 opacity-90'
                      : hasBookings
                      ? 'bg-white border-slate-200 hover:border-slate-400'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-action text-white'
                          : isBlocked
                          ? 'text-slate-500'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.hasConflict && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="تعارض حجوزات" />
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="space-y-1 overflow-hidden">
                    {isBlocked && (
                      <div className="p-1 rounded-md bg-slate-200/90 text-slate-800 text-2xs font-medium truncate flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{day.blockedInfo?.reason || 'مغلق'}</span>
                      </div>
                    )}

                    {day.bookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className={`p-1 rounded-md text-2xs font-bold truncate flex items-center gap-1 ${
                          b.source === 'platform'
                            ? 'bg-blue-100 text-blue-900'
                            : b.source === 'direct_bio_link'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span className="truncate">{b.customerName}</span>
                      </div>
                    ))}

                    {day.bookings.length > 2 && (
                      <span className="text-2xs text-slate-500 font-medium block">
                        +{day.bookings.length - 2} مناسبات أخرى
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend & iCal Sync Box */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Color Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300" />
                <span>حجز من المنصة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
                <span>حجز خارجي (اتصال / إنستقرام)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-400" />
                <span>يوم محظور / صيانة</span>
              </div>
            </div>

            {/* iCal Link Export */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyICal}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-action" />
                <span>{copiedICal ? '✓ تم نسخ رابط iCal' : 'مزامنة مع تقويم Google / Apple'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Selected Day Agenda & Conflicts Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-5">
            
            {/* Header of selected day */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-500 font-medium block">جدول اليوم المحدد</span>
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedDate}
                </h4>
              </div>

              {selectedDayBlocked ? (
                <button
                  onClick={() => onRemoveBlockedDate(selectedDayBlocked.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium flex items-center gap-1 hover:bg-rose-100"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>إلغاء الحظر</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  {selectedDayBookings.length} مناسبات مجدولة
                </span>
              )}
            </div>

            {/* Blocked Date Alert if any */}
            {selectedDayBlocked && (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <span>هذا التاريخ مغلق حالياً أمام أي حجوزات جديدة</span>
                </div>
                <p className="text-xs text-slate-600 font-normal">
                  السبب: {selectedDayBlocked.reason} ({selectedDayBlocked.type === 'maintenance' ? 'صيانة معدات' : 'إجازة فريق'})
                </p>
              </div>
            )}

            {/* Bookings for the day */}
            {selectedDayBookings.length === 0 && !selectedDayBlocked ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-800">لا توجد مناسبات في هذا اليوم</h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  هذا اليوم متاح لاستقبال الحجوزات أو يمكنك تسجيل حجز خارجي يدوياً الآن.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenExternalBookingModal(selectedDate)}
                  className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-medium shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل حجز خارجي</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {selectedDayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-medium text-slate-900">{b.customerName}</h5>
                        <span className="text-2xs text-action font-semibold block">{b.serviceTitle}</span>
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-900">
                        {b.totalAmount.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>

                    <VendorConflictBadge hasConflict={b.hasConflict} source={b.source} />

                    <div className="grid grid-cols-2 gap-2 text-2xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{b.startTime} - {b.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{b.guestCount} ضيف</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{b.venueName} ({b.city})</span>
                      </div>
                    </div>

                    {b.notes && (
                      <p className="text-2xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200 font-normal">
                        📝 {b.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenExternalBookingModal(selectedDate)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-action" />
                <span>إضافة حجز في هذا اليوم</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs usil-modal-scroll">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 dropdown-shadow text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">حظر وإغلاق موعد في التقويم</h4>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-medium"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleConfirmBlockDate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">تاريخ الحظر</label>
                <input
                  type="date"
                  value={blockInputDate}
                  onChange={(e) => setBlockInputDate(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-action"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نوع الإغلاق</label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-action"
                >
                  <option value="maintenance">صيانة معدات ودلال وبوفيهات</option>
                  <option value="holiday">إجازة فريق العمل والراحة الأسبوعية</option>
                  <option value="full_day">ارتباط خاص بالمورّد</option>
                  <option value="custom">سبب مخصص</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ملاحظة التوضيح</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="مثال: جرد سنوي، صيانة سيارات النقل..."
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-action"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-medium shadow-xs"
                >
                  تأكيد إغلاق التاريخ
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
