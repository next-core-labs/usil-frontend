import React, { useState } from 'react';
import { FinancialPayout, VendorBooking } from '../../types';
import {
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Percent,
  Receipt,
  Store,
  DollarSign,
} from 'lucide-react';

interface VendorFinancialLedgerProps {
  payouts: FinancialPayout[];
  bookings: VendorBooking[];
  onRequestPayout: (amount: number, iban: string) => void;
}

export const VendorFinancialLedger: React.FC<VendorFinancialLedgerProps> = ({
  payouts,
  bookings,
  onRequestPayout,
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(5000);
  const [selectedIban, setSelectedIban] = useState('SA92 8000 0211 4455 6677 4012');
  const [successMessage, setSuccessMessage] = useState('');

  // Total calculations & Revenue Split Logic
  const externalBookings = bookings.filter((b) => b.source !== 'platform');
  const platformBookings = bookings.filter((b) => b.source === 'platform');

  const externalRevenue = externalBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformGrossRevenue = platformBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Platform fee 15% on platform orders, 0% on external
  const platformCommissionDeducted = platformGrossRevenue * 0.15;
  const platformNetVendorRevenue = platformGrossRevenue - platformCommissionDeducted;

  const totalNetVendorRevenue = externalRevenue + platformNetVendorRevenue;
  const totalCommissionSaved = externalRevenue * 0.15; // Savings by using our free external/POS tools

  const heldInEscrow = 11850; // Guaranteed protected funds
  const availableForPayout = 8450; // Cleared funds ready for bank transfer

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestPayout(Number(withdrawAmount), selectedIban);
    setShowWithdrawModal(false);
    setSuccessMessage(`تم رفع طلب تحويل فوري لمبلغ ${Number(withdrawAmount).toLocaleString('ar-SA')} ر.س إلى حسابك البنكي بنجاح.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>نظام الشفافية المالية وعمولات المناسبات (Usil Revenue Split)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            محفظة الأرباح، الضمان البنكي والتحويلات
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            عمولة 0% على مبيعاتك الخارجية ونقاط البيع، وعمولة 15% فقط على الطلبات القادمة من سوق يوصل مع حماية الضمان البنكي.
          </p>
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>طلب سحب أرباح فوري للبنك</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Revenue Split & Zero-Commission Highlight Banner */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Left: External & POS Orders (0% Fee) */}
        <div className="p-5 rounded-3xl bg-emerald-950 text-white card-shadow space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-300 text-[11px] font-bold">
              <Receipt className="w-3.5 h-3.5" />
              <span>مبيعات الكاشير والحجوزات الخارجية • عمولة 0%</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">100% لك</span>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {externalRevenue.toLocaleString('ar-SA')} <span className="text-xs font-sans text-emerald-300">ر.س</span>
            </div>
            <p className="text-xs text-slate-300 font-normal">
              إجمالي مبيعاتك المباشرة عبر الكاشير، الواتساب، والاتصالات. لا تستقطع المنصة أي نسبة وسيط.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300 text-xs font-bold flex items-center justify-between border border-white/10">
            <span>وفرت باستخدام كاشير يوصل:</span>
            <span className="font-mono text-white font-extrabold">+{totalCommissionSaved.toLocaleString('ar-SA')} ر.س</span>
          </div>
        </div>

        {/* Right: Usil Marketplace Orders (15% Fee) */}
        <div className="p-5 rounded-3xl bg-[#0A1A33] text-white card-shadow space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C0A16B] text-[11px] font-bold">
              <Store className="w-3.5 h-3.5" />
              <span>طلبات منصة يوصل العامة • عمولة 15%</span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-300">85% صافي للمورّد</span>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {platformNetVendorRevenue.toLocaleString('ar-SA')} <span className="text-xs font-sans text-slate-300">ر.س (صافي)</span>
            </div>
            <p className="text-xs text-slate-300 font-normal">
              من إجمالي مبيعات {platformGrossRevenue.toLocaleString('ar-SA')} ر.س بعد خصم 15% عمولة التسويق والوساطة المعتمدة.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold flex items-center justify-between border border-white/10">
            <span>العمولة المحتسبة للمنصة (15%):</span>
            <span className="font-mono text-[#C0A16B] font-extrabold">{platformCommissionDeducted.toLocaleString('ar-SA')} ر.س</span>
          </div>
        </div>

      </div>

      {/* 3 Metric Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        
        {/* Card 1: Available Payout */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">الرصيد المتاح للتحويل الفوري</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
            {availableForPayout.toLocaleString('ar-SA')} <span className="text-sm font-sans text-slate-500">ر.س</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            أرباح المناسبات المنجزة الجاهزة للتحويل لآيبانك
          </p>
        </div>

        {/* Card 2: Held in Escrow */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">مبالغ محفوظة في حساب الضمان</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#155EEF]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
            {heldInEscrow.toLocaleString('ar-SA')} <span className="text-sm font-sans text-slate-500">ر.س</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            تُصرف تلقائياً إلى رصيدك فور انتهاء مناسبات هذا الأسبوع
          </p>
        </div>

        {/* Card 3: Total Cumulative */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">صافي دخل المورّد الإجمالي</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#155EEF]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#155EEF]">
            {totalNetVendorRevenue.toLocaleString('ar-SA')} <span className="text-sm font-sans text-slate-500">ر.س</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            المجموع الصافي الفعلي بعد العمولات والتسويات
          </p>
        </div>

      </div>

      {/* Payouts History Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          سجل التحويلات البنكية والتسويات الأخيرة
        </h3>

        <div className="divide-y divide-slate-100">
          {payouts.map((p) => (
            <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{p.reference}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {p.status === 'completed' ? 'تم التحويل لحسابك البنكي' : 'محفوظ في الضمان'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-normal">{p.description}</p>
                <div className="text-[11px] text-slate-400 font-mono">{p.bankAccount}</div>
              </div>

              <div className="text-left">
                <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                  {p.amount.toLocaleString('ar-SA')} ر.س
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 dropdown-shadow text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">طلب تحويل بنكي فوري</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المبلغ المطلوب سحبه (ر.س)</label>
                <input
                  type="number"
                  max={availableForPayout}
                  min={500}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-[#155EEF]"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  الحد الأقصى المتاح الآن: {availableForPayout.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحساب البنكي والآيبان</label>
                <input
                  type="text"
                  value={selectedIban}
                  onChange={(e) => setSelectedIban(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#155EEF]"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="font-bold">معلومات التحويل الفوري (سريع SARIE):</div>
                <div className="text-[11px] text-blue-800">
                  يصل التحويل إلى حسابك البنكي خلال أقل من 15 دقيقة على مدار الساعة.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  تأكيد التحويل الآن
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
