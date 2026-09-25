import React, { useState } from 'react';
import {
  CrewPayrollEntry,
  CrewMember,
  VendorBrandSettings,
  ConsolidatedCrewPaymentVoucher,
} from '../../../types';
import { tafqeetSAR } from '../../../utils/arabicNumberToWords';
import { generateCrewPayrollVoucherPDF } from '../../../utils/zatcaPdfExporter';
import {
  Receipt,
  Printer,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  FileCheck,
  ShieldCheck,
  Send,
  X,
  Share2,
  Hash,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';

interface UnifiedPaymentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: CrewPayrollEntry[];
  brandSettings: VendorBrandSettings;
  crewMembers: CrewMember[];
  onConfirmIssuedVoucher?: (
    voucher: ConsolidatedCrewPaymentVoucher,
    autoCreateExpense: boolean
  ) => void;
  existingVoucher?: ConsolidatedCrewPaymentVoucher | null;
}

export const UnifiedPaymentVoucherModal: React.FC<UnifiedPaymentVoucherModalProps> = ({
  isOpen,
  onClose,
  selectedEntries,
  brandSettings,
  crewMembers,
  onConfirmIssuedVoucher,
  existingVoucher,
}) => {
  if (!isOpen) return null;

  const isViewOnly = !!existingVoucher;

  // Form states for new issuance
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'mada'>(
    existingVoucher ? existingVoucher.paymentMethod : 'bank_transfer'
  );
  const [bankReference, setBankReference] = useState(
    existingVoucher?.bankReferenceNumber || `SARIE-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [preparedBy, setPreparedBy] = useState(
    existingVoucher?.preparedBy || 'سعد المحاسب المالي'
  );
  const [approvedBy, setApprovedBy] = useState(
    existingVoucher?.approvedBy || 'المدير المالي التنفيذي'
  );
  const [voucherNotes, setVoucherNotes] = useState(
    existingVoucher?.notes || 'تم صرف أجور الطاقم الميداني عن المناسبات المنجزة حسب ساعات العمل المعتمدة.'
  );
  const [autoCreateExpense, setAutoCreateExpense] = useState(true);
  const [voucherNumber] = useState(
    existingVoucher?.voucherNumber || `CPV-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issueDate] = useState(
    existingVoucher?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [isSuccessIssued, setIsSuccessIssued] = useState(false);

  // Entries to display
  const entriesToProcess = existingVoucher
    ? existingVoucher.entriesSummary.map((item) => ({
        id: item.entryId,
        crewId: item.crewId,
        crewName: item.crewName,
        role: item.role,
        bookingId: '',
        eventTitle: item.eventTitle,
        eventDate: item.eventDate,
        regularHours: item.regularHours,
        overtimeHours: item.overtimeHours,
        hourlyRate: item.hourlyRate,
        earnedAmount: item.grossAmount,
        bonusAmount: item.bonusAmount,
        deductionAmount: item.deductionAmount,
        netPayout: item.netPayout,
        paymentStatus: 'paid' as const,
        bankIban: item.bankIban,
      }))
    : selectedEntries;

  // Aggregate Calculations
  const totalRegularHours = entriesToProcess.reduce((sum, e) => sum + (e.regularHours || 0), 0);
  const totalOvertimeHours = entriesToProcess.reduce((sum, e) => sum + (e.overtimeHours || 0), 0);
  const totalHours = totalRegularHours + totalOvertimeHours;
  const totalGrossAmount = entriesToProcess.reduce((sum, e) => sum + (e.earnedAmount || 0), 0);
  const totalBonusAmount = entriesToProcess.reduce((sum, e) => sum + (e.bonusAmount || 0), 0);
  const totalDeductionAmount = entriesToProcess.reduce((sum, e) => sum + (e.deductionAmount || 0), 0);
  const totalConsolidatedAmount = entriesToProcess.reduce((sum, e) => sum + (e.netPayout || 0), 0);

  const tafqeetText = tafqeetSAR(totalConsolidatedAmount);

  /**
   * One builder for both the "issue voucher" and "download PDF" paths. They
   * previously kept near-identical literals, and the PDF copy had drifted: it
   * omitted the required `title` and `payrollEntryIds`, so a PDF downloaded
   * before the voucher was issued printed an untitled sheet.
   */
  const buildVoucher = (): ConsolidatedCrewPaymentVoucher => ({
    id: `cpv-${Date.now()}`,
    voucherNumber,
    issueDate,
    paidDate: issueDate,
    title: `سند صرف موحد - مسير أجور ${entriesToProcess.length} أفراد من الطاقم (${totalConsolidatedAmount} ر.س)`,
    payrollEntryIds: entriesToProcess.map((entry) => entry.id),
    entriesSummary: entriesToProcess.map((entry) => {
      const crew = crewMembers.find((member) => member.id === entry.crewId);
      return {
        entryId: entry.id,
        crewId: entry.crewId,
        crewName: entry.crewName || 'عضو الطاقم',
        role: entry.role,
        eventTitle: entry.eventTitle,
        eventDate: entry.eventDate,
        regularHours: entry.regularHours || 0,
        overtimeHours: entry.overtimeHours || 0,
        hourlyRate: entry.hourlyRate || entry.earnedAmount / Math.max(1, entry.regularHours || 1),
        grossAmount: entry.earnedAmount,
        bonusAmount: entry.bonusAmount || 0,
        deductionAmount: entry.deductionAmount || 0,
        netPayout: entry.netPayout,
        bankIban: entry.bankIban || crew?.bankIban,
        bankName: crew?.bankName || 'مصرف الراجحي',
      };
    }),
    totalCrewCount: entriesToProcess.length,
    totalRegularHours,
    totalOvertimeHours,
    totalHours,
    totalGrossAmount,
    totalBonusAmount,
    totalDeductionAmount,
    totalConsolidatedAmount,
    paymentMethod,
    bankReferenceNumber: paymentMethod === 'bank_transfer' ? bankReference : undefined,
    status: 'paid_completed',
    preparedBy,
    approvedBy,
    notes: voucherNotes,
  });

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onConfirmIssuedVoucher) return;
    onConfirmIssuedVoucher(buildVoucher(), autoCreateExpense);
    setIsSuccessIssued(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateCrewPayrollVoucherPDF(existingVoucher || buildVoucher(), brandSettings);
  };

  const handleShareWhatsApp = () => {
    const text = `📄 *سند صرف موحد معتمد*\nرقم السند: ${voucherNumber}\nالمبلغ الإجمالي: ${totalConsolidatedAmount.toLocaleString('ar-SA')} ر.س\nعدد أفراد الطاقم: ${entriesToProcess.length}\nإجمالي ساعات العمل: ${totalHours} ساعة\nطريقة الصرف: ${paymentMethod === 'bank_transfer' ? 'حوالة بنكية سريعة' : 'نقداً (كاش)'}\nالمنشأة: ${brandSettings.brandName}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-right usil-modal-scroll">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Modal Controls Header (Screen Only) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isViewOnly ? 'معاينة سند الصرف الموحد الرسمي' : 'إصدار سند صرف مالي موحد لطاقم العمل'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-medium border border-emerald-500/30">
                  {voucherNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                سند رسمي معتمد لصرف أجور ومستحقات الساعات الميدانية لعدة موظفين في كشف موحد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل سند صرف PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">واتساب</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
             aria-label="إغلاق"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Scrollable Printable Voucher Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 printable-voucher">
          
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Brand & Vendor Details */}
              <div className="flex items-center gap-4">
                <img
                  src={brandSettings.logoUrl}
                  alt={brandSettings.brandName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-300 bg-white"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                    {brandSettings.brandName}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">{brandSettings.slogan}</p>
                  <div className="flex items-center gap-3 text-2xs text-slate-600 pt-1 font-mono">
                    <span>س.ت: {brandSettings.crNumber}</span>
                    <span>•</span>
                    <span>الرقم الضريبي: {brandSettings.vatNumber}</span>
                  </div>
                </div>
              </div>

              {/* Voucher Metadata Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 min-w-[220px] space-y-1.5 text-xs text-right">
                <div className="text-center font-bold text-sm text-slate-900 border-b border-slate-200 pb-1.5">
                  سند صرف مالي موحد
                  <span className="block text-2xs font-mono text-emerald-800 font-normal">CONSOLIDATED PAYMENT VOUCHER</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>رقم السند:</span>
                  <span className="font-mono font-bold text-slate-900">{voucherNumber}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>تاريخ التحرير:</span>
                  <span className="font-mono font-bold text-slate-800">{issueDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>حالة السداد:</span>
                  <span className="font-bold text-emerald-800">
                    {existingVoucher?.status === 'paid_completed' || !isViewOnly ? 'معتمد ومسدد' : 'بانتظار الصرف'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Beneficiaries & Hours Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 block">عدد المستفيدين:</span>
              <span className="font-bold text-sm text-slate-900 font-mono">
                {entriesToProcess.length} أفراد طاقم
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block">إجمالي الساعات المسجلة:</span>
              <span className="font-bold text-sm text-blue-800 font-mono">
                {totalHours} ساعة <span className="text-2xs text-slate-500">({totalRegularHours} أساسي + {totalOvertimeHours} إضافي)</span>
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block">طريقة السداد:</span>
              <span className="font-bold text-sm text-slate-900">
                {paymentMethod === 'bank_transfer'
                  ? 'حوالة بنكية سريعة'
                  : paymentMethod === 'mada'
                  ? 'بطاقة مدى / كاشير'
                  : 'نقداً (كاش)'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 block">إجمالي صافي المبلغ:</span>
              <span className="font-bold text-sm text-emerald-800 font-mono">
                {totalConsolidatedAmount.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>

          {/* Table of Included Crew Members and Hourly Calculations */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">اسم المستفيد / الدور</th>
                  <th className="py-2.5 px-3">المناسبة / التاريخ</th>
                  <th className="py-2.5 px-3 text-center">ساعات أساسية</th>
                  <th className="py-2.5 px-3 text-center">ساعات إضافية</th>
                  <th className="py-2.5 px-3 text-center">أجر الساعة</th>
                  <th className="py-2.5 px-3">الإجمالي</th>
                  <th className="py-2.5 px-3">مكافأة / حسم</th>
                  <th className="py-2.5 px-3 font-bold text-slate-900 text-left">الصافي للصرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entriesToProcess.map((entry, index) => {
                  const crew = crewMembers.find((c) => c.id === entry.crewId);
                  const regHours = entry.regularHours ?? 0;
                  const otHours = entry.overtimeHours ?? 0;
                  const rate = entry.hourlyRate ?? (crew?.hourlyRate || 60);

                  return (
                    <tr key={entry.id || index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{entry.crewName}</div>
                        <div className="text-2xs text-blue-700 font-semibold">{entry.role}</div>
                        {(entry.bankIban || crew?.bankIban) && (
                          <div className="text-2xs font-mono text-slate-400 tracking-tight">
                            {entry.bankIban || crew?.bankIban}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800 max-w-[180px] truncate">
                          {entry.eventTitle}
                        </div>
                        <div className="text-2xs text-slate-400 font-mono">{entry.eventDate}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {regHours} س
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                        {otHours > 0 ? `${otHours} س (1.5×)` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {rate} ر.س
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {entry.earnedAmount.toLocaleString('ar-SA')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-2xs">
                        {entry.bonusAmount ? (
                          <span className="text-emerald-700 font-bold">+{entry.bonusAmount}</span>
                        ) : entry.deductionAmount ? (
                          <span className="text-rose-700 font-bold">-{entry.deductionAmount}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-950 text-sm text-left">
                        {entry.netPayout.toLocaleString('ar-SA')} ر.س
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right">
                    الإجمالي العام لكشف المسير الموحد:
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-800">{totalRegularHours} س</td>
                  <td className="py-3 px-3 text-center font-mono text-amber-800">{totalOvertimeHours} س</td>
                  <td className="py-3 px-3 text-center text-slate-400">-</td>
                  <td className="py-3 px-3 font-mono">{totalGrossAmount.toLocaleString('ar-SA')}</td>
                  <td className="py-3 px-3 font-mono text-emerald-800">
                    +{totalBonusAmount - totalDeductionAmount}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-base text-emerald-900 text-left">
                    {totalConsolidatedAmount.toLocaleString('ar-SA')} ر.س
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tafqeet & Amount in Words Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-emerald-800 font-bold block">المبلغ الإجمالي كتابةً وفقط:</span>
              <span className="font-bold text-sm sm:text-base text-emerald-950">
                {tafqeetText}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-mono font-bold text-sm shrink-0">
              {totalConsolidatedAmount.toLocaleString('ar-SA')} SAR
            </div>
          </div>

          {/* Issuance Form Controls (Visible only when generating a new voucher) */}
          {!isViewOnly && !isSuccessIssued && (
            <form onSubmit={handleConfirmSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-medium text-xs">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>بيانات الدفع والاعتماد المحاسبي</span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">طريقة السداد *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-right"
                    >
                      <option value="bank_transfer">حوالة بنكية سريعة (سريع / مسيرات)</option>
                      <option value="cash">صرف نقدي فوري (كاش من الخزينة)</option>
                      <option value="mada">بطاقة بنكية / مدى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {paymentMethod === 'bank_transfer' ? 'المرجع البنكي / رقم الحوالة' : 'رقم القيد / الإشعار'}
                    </label>
                    <input
                      type="text"
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="مثال: SARIE-998822"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المحاسب المالي المعد *</label>
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={(e) => setPreparedBy(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات وقيد الصرف</label>
                  <input
                    type="text"
                    value={voucherNotes}
                    onChange={(e) => setVoucherNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-right"
                  />
                </div>

                {/* Auto create expense checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={autoCreateExpense}
                    onChange={(e) => setAutoCreateExpense(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    ترحيل تلقائي إلى سجل المصروفات وقائمة الدخل (P&L) كبند أجور عمالة ومباشرين مباشرة 📊
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وإصدار سند الصرف الموحد ({totalConsolidatedAmount.toLocaleString('ar-SA')} ر.س)</span>
                </button>
              </div>
            </form>
          )}

          {/* Success Banner if Issued */}
          {isSuccessIssued && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  تم اعتماد سند الصرف الموحد رقم {voucherNumber} وتسجيل كافة مستحقات الطاقم كمسددة
                  {autoCreateExpense && ' وترحيلها إلى قائمة الدخل والمصروفات بنجاح!'}.
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white font-medium text-xs"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Official Signatures Section */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-200 text-center text-xs">
            
            <div className="space-y-6">
              <span className="text-slate-500 font-bold block">إعداد المحاسب المالي</span>
              <div className="font-bold text-slate-900">{preparedBy}</div>
              <div className="w-28 mx-auto border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-6">
              <span className="text-slate-500 font-bold block">اعتماد المدير المالي التنفيذي</span>
              <div className="font-bold text-slate-900">{approvedBy}</div>
              <div className="w-28 mx-auto border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-2 flex flex-col items-center justify-center">
              <span className="text-slate-500 font-bold block">ختم المنشأة والاعتماد الرسمي</span>
              {brandSettings.stampUrl ? (
                <img
                  src={brandSettings.stampUrl}
                  alt="الختم الرسمي"
                  className="w-16 h-16 object-contain mix-blend-multiply opacity-90"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-2xs text-slate-400 font-medium">
                  ختم معتمد
                </div>
              )}
            </div>

          </div>

          {/* Legal Notice */}
          <div className="text-2xs text-slate-400 text-center pt-2 border-t border-slate-100">
            تم إصدار هذا السند المالي الموحد عبر نظام التشغيل الذكي للمناسبات • يخضع لسياسات العمل وأجور الطواقم الميدانية
          </div>

        </div>

      </div>
    </div>
  );
};
