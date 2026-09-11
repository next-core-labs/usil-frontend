import React, { useState } from 'react';
import {
  FinancialPayout,
  VendorBooking,
  VendorInvoice,
  ExpenseRecord,
  ReceivableDebt,
  CrewPayrollEntry,
  POSSaleRecord,
  VendorBrandSettings,
  CrewMember,
  ConsolidatedCrewPaymentVoucher,
} from '../../types';
import { VendorProfitAndLoss } from './accounting/VendorProfitAndLoss';
import { VendorReceivablesManager } from './accounting/VendorReceivablesManager';
import { VendorExpenseManager } from './accounting/VendorExpenseManager';
import { VendorEventCosting } from './accounting/VendorEventCosting';
import { VendorZatcaVatReport } from './accounting/VendorZatcaVatReport';
import { VendorCrewPayroll } from './accounting/VendorCrewPayroll';
import {
  Wallet,
  Scale,
  TrendingUp,
  Receipt,
  FileCheck2,
  Users,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  DollarSign,
  PieChart,
  Calculator,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';

interface VendorFinancialSuiteProps {
  payouts: FinancialPayout[];
  bookings: VendorBooking[];
  invoices: VendorInvoice[];
  expenses: ExpenseRecord[];
  receivables: ReceivableDebt[];
  payrollEntries: CrewPayrollEntry[];
  posSales: POSSaleRecord[];
  brandSettings: VendorBrandSettings;
  crewMembers: CrewMember[];
  consolidatedVouchers?: ConsolidatedCrewPaymentVoucher[];
  onRequestPayout: (amount: number, iban: string) => void;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'voucherNumber'>) => void;
  onDeleteExpense: (id: string) => void;
  onRecordReceivablePayment: (debtId: string, amount: number, method: string) => void;
  onSendReceivableReminder: (debtId: string, phone: string, message: string) => void;
  onAddPayrollEntry: (entry: Omit<CrewPayrollEntry, 'id'>) => void;
  onMarkPayrollPaid: (id: string, method: 'bank_transfer' | 'cash') => void;
  onBatchMarkPayrollPaid?: (
    ids: string[],
    voucherNumber: string,
    method: 'bank_transfer' | 'cash' | 'mada'
  ) => void;
  onAddConsolidatedVoucher?: (
    voucher: ConsolidatedCrewPaymentVoucher,
    autoCreateExpense: boolean
  ) => void;
  onAutoCalculatePayrollFromHours?: () => void;
}

export type AccountingTab =
  | 'pnl'
  | 'receivables'
  | 'expenses'
  | 'costing'
  | 'zatca'
  | 'payroll'
  | 'wallet';

export const VendorFinancialSuite: React.FC<VendorFinancialSuiteProps> = ({
  payouts,
  bookings,
  invoices,
  expenses,
  receivables,
  payrollEntries,
  posSales,
  brandSettings,
  crewMembers,
  consolidatedVouchers = [],
  onRequestPayout,
  onAddExpense,
  onDeleteExpense,
  onRecordReceivablePayment,
  onSendReceivableReminder,
  onAddPayrollEntry,
  onMarkPayrollPaid,
  onBatchMarkPayrollPaid,
  onAddConsolidatedVoucher,
  onAutoCalculatePayrollFromHours,
}) => {
  const [activeTab, setActiveTab] = useState<AccountingTab>('pnl');

  // Payout Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(5000);
  const [selectedIban, setSelectedIban] = useState(brandSettings.iban || 'SA92 8000 0211 4455 6677 4012');
  const [successMessage, setSuccessMessage] = useState('');

  // Calculations for Wallet
  const externalBookings = bookings.filter((b) => b.source !== 'platform');
  const platformBookings = bookings.filter((b) => b.source === 'platform');
  const externalRevenue = externalBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformGrossRevenue = platformBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformCommissionDeducted = platformGrossRevenue * 0.15;
  const platformNetVendorRevenue = platformGrossRevenue - platformCommissionDeducted;
  const totalCommissionSaved = externalRevenue * 0.15;

  const availableForPayout = 8450;
  const heldInEscrow = 11850;

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestPayout(Number(withdrawAmount), selectedIban);
    setShowWithdrawModal(false);
    setSuccessMessage(
      `تم رفع طلب تحويل فوري لمبلغ ${Number(withdrawAmount).toLocaleString('ar-SA')} ر.س إلى حسابك البنكي بنجاح.`
    );
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const navSubTabs = [
    {
      id: 'pnl',
      label: 'قائمة الدخل والأرباح (P&L)',
      icon: TrendingUp,
    },
    {
      id: 'receivables',
      label: 'الذمم والتحصيل الذكي',
      icon: Clock,
      count: receivables.filter((r) => r.status.startsWith('overdue')).length || undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'expenses',
      label: 'سندات الصرف والمصروفات',
      icon: Receipt,
      count: expenses.length,
    },
    {
      id: 'costing',
      label: 'ربحية وتسعير المناسبات',
      icon: Calculator,
    },
    {
      id: 'zatca',
      label: 'إقرار زكاة وضريبة ZATCA',
      icon: FileCheck2,
      badgeText: '15% آلي',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'payroll',
      label: 'مسير أجور المباشرين',
      icon: Users,
      count: payrollEntries.filter((p) => p.paymentStatus === 'pending').length || undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'wallet',
      label: 'الضمان البنكي والسحب',
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Universal Accounting Hub Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow p-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {navSubTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AccountingTab)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badgeText && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      tab.badgeColor || 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ACTIVE SUB-TAB VIEW */}
      {activeTab === 'pnl' && (
        <VendorProfitAndLoss
          bookings={bookings}
          expenses={expenses}
          posSales={posSales}
          payouts={payouts}
          brandName={brandSettings.brandName}
        />
      )}

      {activeTab === 'receivables' && (
        <VendorReceivablesManager
          receivables={receivables}
          brandSettings={brandSettings}
          onRecordPayment={onRecordReceivablePayment}
          onSendReminder={onSendReceivableReminder}
        />
      )}

      {activeTab === 'expenses' && (
        <VendorExpenseManager
          expenses={expenses}
          bookings={bookings}
          onAddExpense={onAddExpense}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {activeTab === 'costing' && (
        <VendorEventCosting bookings={bookings} expenses={expenses} />
      )}

      {activeTab === 'zatca' && (
        <VendorZatcaVatReport
          invoices={invoices}
          expenses={expenses}
          posSales={posSales}
          brandSettings={brandSettings}
        />
      )}

      {activeTab === 'payroll' && (
        <VendorCrewPayroll
          payrollEntries={payrollEntries}
          crewMembers={crewMembers}
          bookings={bookings}
          brandSettings={brandSettings}
          consolidatedVouchers={consolidatedVouchers}
          onAddPayrollEntry={onAddPayrollEntry}
          onMarkPayrollAsPaid={onMarkPayrollPaid}
          onBatchMarkPayrollPaid={onBatchMarkPayrollPaid}
          onAddConsolidatedVoucher={onAddConsolidatedVoucher}
          onAutoCalculatePayrollFromHours={onAutoCalculatePayrollFromHours}
        />
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-6">
          
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

          {/* Revenue Split Cards */}
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
                  <Building className="w-3.5 h-3.5" />
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

          {/* Metric Cards */}
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">الرصيد المتاح للتحويل الفوري</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
                {availableForPayout.toLocaleString('ar-SA')}{' '}
                <span className="text-xs font-sans text-slate-500">ر.س</span>
              </div>
              <p className="text-[11px] text-slate-500">
                أرباح مناسبات مكتملة تم تأكيد جاهزيتها
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">مبالغ محفوظة في حساب الضمان (Escrow)</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700">
                {heldInEscrow.toLocaleString('ar-SA')}{' '}
                <span className="text-xs font-sans text-slate-500">ر.س</span>
              </div>
              <p className="text-[11px] text-slate-500">
                تُصرف تلقائياً فور إتمام مناسبات هذا الأسبوع
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">الحساب البنكي المعتمد</span>
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-extrabold text-slate-800">
                  {brandSettings.bankName || 'مصرف الراجحي'}
                </div>
                <div className="font-mono text-xs text-slate-500 dir-ltr text-right">
                  {brandSettings.iban}
                </div>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold">
                ✓ آيبان معتمد للتحويل السريع IPS
              </p>
            </div>
          </div>

          {/* Previous Payouts Table */}
          <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-base font-extrabold text-slate-900">
                سجل التحويلات البنكية ومسحوبات الأرباح
              </h4>
              <span className="text-xs text-slate-500">تحويل فوري إلى الحساب البنكي</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">رقم العملية</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المبلغ المحول</th>
                    <th className="py-3 px-4">الحساب المستلم</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{payout.reference}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{payout.date}</td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                        {payout.amount.toLocaleString('ar-SA')} ر.س
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{payout.bankAccount}</td>
                      <td className="py-3.5 px-4">
                        {payout.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مكتمل ومحول للبنك
                          </span>
                        )}
                        {payout.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            جاري المعالجة البنكية
                          </span>
                        )}
                        {payout.status === 'held_escrow' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            محفوظ في الضمان
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 text-right card-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-slate-900">
                طلب سحب أرباح فوري إلى الحساب البنكي
              </h4>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-900 font-bold">الرصيد المتاح للسحب الآن:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">
                  {availableForPayout.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المطلوب سحبه (ر.س) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={availableForPayout}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-right focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التحويل إلى الآيبان البنكي *</label>
                <input
                  type="text"
                  required
                  value={selectedIban}
                  onChange={(e) => setSelectedIban(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-right bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                >
                  تأكيد وإرسال الحوالة البنكية
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
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
