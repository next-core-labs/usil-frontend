import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { Calculator, Check, MessageCircle, Users, Calendar, MapPin, Tag, X, Coins } from 'lucide-react';
import type { ServiceItem } from '../types';

interface QuickEventCalculatorProps {
  onClose?: () => void;
  services?: ServiceItem[];
}

export const QuickEventCalculator: React.FC<QuickEventCalculatorProps> = ({
  onClose,
  services = [],
}) => {
  const { t, i18n } = useTranslation();
  const { currency, formatPrice, currencyInfo, symbol } = useCurrency();
  const isArabic = (i18n.language || 'ar').startsWith('ar');

  const [eventType, setEventType] = useState('زواج وملكة');
  const [guestCount, setGuestCount] = useState(100);
  const [selectedCity, setSelectedCity] = useState('الرياض');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const eventTypes = [
    { id: 'wedding', label: 'زواج وملكة', discount: 0.15 },
    { id: 'graduation', label: 'حفل تخرج', discount: 0.10 },
    { id: 'corporate', label: 'مؤتمرات وشركات', discount: 0.12 },
    { id: 'private', label: 'ضيافة خاصة ومنزلية', discount: 0.08 },
    { id: 'reception', label: 'استقبال وافتتاح', discount: 0.10 },
  ];

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculations
  let rawTotal = 0;
  selectedServiceIds.forEach((id) => {
    const s = services.find((item) => item.id === id);
    if (s) {
      if (s.priceUnit === 'للشخص') {
        rawTotal += s.price * guestCount;
      } else {
        rawTotal += s.price;
      }
    }
  });

  const currentTypeObj = eventTypes.find((t) => t.label === eventType) || eventTypes[0];
  const discountPercent = selectedServiceIds.length >= 3 ? currentTypeObj.discount : 0;
  const discountAmount = Math.round(rawTotal * discountPercent);
  const finalTotal = rawTotal - discountAmount;

  const handleSendWhatsAppQuote = () => {
    const chosenServicesNames = selectedServiceIds
      .map((id) => {
        const s = services.find((item) => item.id === id);
        return s ? `• ${s.title} (${s.priceUnit === 'للشخص' ? `${formatPrice(s.price)} × ${guestCount} ضيف` : `${formatPrice(s.price)}`})` : '';
      })
      .filter(Boolean)
      .join('\n');

    const currencyText = currency !== 'SAR' ? ` (${currency})` : '';

    const message = `طلب تسعير وحجز باقة مناسبة من منصة يوصل\n\n` +
      `👤 الاسم: ${clientName || 'عميل كريم'}\n` +
      `📱 الجوال: ${clientPhone || 'غير محدد'}\n` +
      `🏛️ نوع المناسبة: ${eventType}\n` +
      `👥 الحضور المتوقع: ${guestCount} شخص\n` +
      `📍 المدينة: ${selectedCity}\n` +
      `📅 التاريخ: ${eventDate || 'يحدد لاحقاً'}\n\n` +
      `📋 الخدمات المطلوبة:\n${chosenServicesNames}\n\n` +
      `💰 المجموع الأساسي: ${formatPrice(rawTotal)}\n` +
      (discountAmount > 0 ? `🎁 خصم باقة يوصل (${Math.round(discountPercent * 100)}%): -${formatPrice(discountAmount)}\n` : '') +
      `💎 الصافي بعد الخصم: ${formatPrice(finalTotal)}${currencyText}\n\n` +
      `يرجى تأكيد التوفر وجدولة موعد التجهيز. شكراً!`;

    const url = `/support?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 card-shadow text-right">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>حاسبة الباقات المعتمدة</span>
            </div>
            {currency !== 'SAR' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                <Coins className="w-3 h-3 text-amber-600" />
                <span>العملة: {currency} ({t('currencyRateNotice', 'الأسعار محولة وفق سعر الصرف التقريبي')})</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            حاسبة ميزانية المناسبة وخصومات الباقات
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            احسب تكلفة التوريد وفق عدد الضيوف والخدمات مع تطبيق خصم الباقات المجمعة تلقائياً عند اختيار 3 خدمات فأكثر.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid lg:grid-cols-12 gap-8 pt-6">
        
        {/* Parameters Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Event Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. نوع المناسبة
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eventTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEventType(t.label)}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    eventType === t.label
                      ? 'bg-[#0A1A33] border-[#0A1A33] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Guest Count Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#155EEF]" />
                <span>2. عدد الضيوف المتوقع</span>
              </label>
              <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold text-sm font-mono">
                {guestCount} ضيف
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              aria-label="عدد الضيوف"
              className="w-full accent-[#155EEF] h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium">
              <span>20 ضيف</span>
              <span>150 ضيف</span>
              <span>300 ضيف</span>
              <span>500+ ضيف</span>
            </div>
          </div>

          {/* 3. Location and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>المدينة</span>
              </label>
              <PlaceSearchSelect
                value={selectedCity}
                onChange={setSelectedCity}
                includeAll={false}
                boxed
                aria-label="المدينة للمناسبة"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ المناسبة التقريبي</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                aria-label="تاريخ المناسبة التقريبي"
                className="w-full p-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:border-[#155EEF] focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Services Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>4. اختر الخدمات المشمولة في الباقة:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                (اختر 3 خدمات فأكثر للحصول على الخصم الفوري)
              </span>
            </label>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {services.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-200">
                  ما فيه منتجات مورّدين في السوق بعد. الآلة الحاسبة تشتغل على منتجات حقيقية فقط.
                </p>
              ) : (
              services.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                const sPrice = s.priceUnit === 'للشخص' ? s.price * guestCount : s.price;

                return (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-50 border-[#0A1A33] text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#155EEF] border-[#155EEF] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block text-slate-900">
                          {s.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {s.categoryName} • {formatPrice(s.price)} / {s.priceUnit}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-bold text-slate-900 text-xs sm:text-sm font-mono">
                      {formatPrice(sPrice)}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

        </div>

        {/* Live Summary & Actions Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-800">ملخص تسعير الباقة</span>
              <span className="text-xs text-slate-900 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                {selectedServiceIds.length} خدمات
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>المجموع الأساسي:</span>
                <span className="font-bold text-slate-900 font-mono">{formatPrice(rawTotal)}</span>
              </div>

              {discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>خصم الباقة المجمعة ({Math.round(discountPercent * 100)}%):</span>
                  </span>
                  <span className="font-mono">- {formatPrice(discountAmount)}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  💡 اختر 3 خدمات أو أكثر للحصول على خصم الباقات الفوري
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>الضريبة والتجهيز:</span>
                <span className="text-slate-700 font-bold">مشمول بالكامل</span>
              </div>
            </div>

            {/* Total Grand Amount */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">الإجمالي التقديري الصافي</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                  {formatPrice(finalTotal)}
                </div>
              </div>
              <div className="text-left text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                تسعير شفاف معتمد
              </div>
            </div>

            {/* Contact Details */}
            <div className="pt-3 space-y-2.5 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  الاسم الكريم
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="اسم صاحب الطلب"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-[#155EEF] focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-[#155EEF] focus:outline-none font-mono"
                />
              </div>
            </div>

          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleSendWhatsAppQuote}
            className="w-full py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب وحجز الباقة عبر واتساب</span>
          </button>

        </div>

      </div>
    </div>
  );
};
