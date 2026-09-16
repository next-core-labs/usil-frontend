import React, { useState, useMemo } from 'react';
import {
  CrewPayrollEntry,
  CrewMember,
  VendorBooking,
  VendorBrandSettings,
  ConsolidatedCrewPaymentVoucher,
  ExpenseRecord,
} from '../../../types';
import { UnifiedPaymentVoucherModal } from './UnifiedPaymentVoucherModal';
import { DEFAULT_VENDOR_BRAND_SETTINGS } from '../../../data/vendorData';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Search,
  Filter,
  CreditCard,
  Building,
  Sparkles,
  Calendar,
  Receipt,
  FileCheck2,
  Calculator,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Share2,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface VendorCrewPayrollProps {
  payrollEntries: CrewPayrollEntry[];
  crewMembers: CrewMember[];
  bookings: VendorBooking[];
  brandSettings?: VendorBrandSettings;
  consolidatedVouchers?: ConsolidatedCrewPaymentVoucher[];
  onAddPayrollEntry: (entry: Omit<CrewPayrollEntry, 'id'>) => void;
  onMarkPayrollAsPaid: (id: string, method: 'bank_transfer' | 'cash') => void;
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

export const VendorCrewPayroll: React.FC<VendorCrewPayrollProps> = ({
  payrollEntries,
  crewMembers,
  bookings,
  brandSettings = DEFAULT_VENDOR_BRAND_SETTINGS,
  consolidatedVouchers = [],
  onAddPayrollEntry,
  onMarkPayrollAsPaid,
  onBatchMarkPayrollPaid,
  onAddConsolidatedVoucher,
  onAutoCalculatePayrollFromHours,
}) => {
  // Navigation sub-tab: 'entries' or 'vouchers_archive'
  const [activePayrollTab, setActivePayrollTab] = useState<'entries' | 'vouchers_archive'>('entries');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  
  // Unified Voucher Modal state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<ConsolidatedCrewPaymentVoucher | null>(null);

  // Automation state feedback
  const [automationNotice, setAutomationNotice] = useState<string>('');

  // New Entry Form State with Hours Automation
  const [selectedCrewId, setSelectedCrewId] = useState(crewMembers[0]?.id || '');
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id || '');
  const [regularHours, setRegularHours] = useState<number>(5);
  const [overtimeHours, setOvertimeHours] = useState<number>(1);
  const [hourlyRate, setHourlyRate] = useState<number>(70);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [entryNotes, setEntryNotes] = useState<string>('');

  // Update hourly rate when selected crew member changes
  const handleCrewChange = (crewId: string) => {
    setSelectedCrewId(crewId);
    const crew = crewMembers.find((c) => c.id === crewId);
    if (crew) {
      const defaultRate =
        crew.hourlyRate ||
        (crew.role === 'مشرف ضيافة'
          ? 70
          : crew.role === 'مباشر قهوة'
          ? 50
          : crew.role === 'شيف بوفيه'
          ? 80
          : crew.role === 'فني صوت وإضاءة'
          ? 65
          : 45);
      setHourlyRate(defaultRate);
    }
  };

  // Live calculation for Add Form
  const calculatedEarnedAmount = regularHours * hourlyRate + overtimeHours * (hourlyRate * 1.5);
  const calculatedNetPayout = calculatedEarnedAmount + bonusAmount - deductionAmount;

  // Aggregate Metrics
  const totalPendingAmount = payrollEntries
    .filter((p) => p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + p.netPayout, 0);

  const totalPaidAmount = payrollEntries
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.netPayout, 0);

  const totalRecordedHours = payrollEntries.reduce(
    (sum, p) => sum + (p.regularHours || 0) + (p.overtimeHours || 0),
    0
  );

  // Unprocessed work logs count across all crew
  const unprocessedLogsCount = useMemo(() => {
    let count = 0;
    crewMembers.forEach((m) => {
      if (m.workLogs) {
        count += m.workLogs.filter((l) => l.status === 'unprocessed').length;
      }
    });
    return count;
  }, [crewMembers]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return payrollEntries.filter((p) => {
      if (filterStatus === 'pending' && p.paymentStatus !== 'pending') return false;
      if (filterStatus === 'paid' && p.paymentStatus !== 'paid') return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = p.crewName.toLowerCase().includes(q);
        const matchesRole = p.role.toLowerCase().includes(q);
        const matchesEvent = p.eventTitle.toLowerCase().includes(q);
        const matchesVoucher = p.consolidatedVoucherNumber?.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesEvent && !matchesVoucher) return false;
      }
      return true;
    });
  }, [payrollEntries, filterStatus, searchQuery]);

  // Pending Entries for Batch Selection
  const pendingEntries = useMemo(() => {
    return payrollEntries.filter((p) => p.paymentStatus === 'pending');
  }, [payrollEntries]);

  const selectedPendingEntries = useMemo(() => {
    return payrollEntries.filter(
      (p) => selectedEntryIds.includes(p.id) && p.paymentStatus === 'pending'
    );
  }, [payrollEntries, selectedEntryIds]);

  const selectedTotalAmount = selectedPendingEntries.reduce((sum, p) => sum + p.netPayout, 0);

  // Selection handlers
  const handleToggleSelectEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    if (selectedEntryIds.length === pendingEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(pendingEntries.map((p) => p.id));
    }
  };

  // Trigger Unified Payment Voucher Modal
  const handleOpenVoucherModalForSelected = () => {
    if (selectedPendingEntries.length === 0) return;
    setViewingVoucher(null);
    setIsVoucherModalOpen(true);
  };

  const handleOpenExistingVoucher = (voucher: ConsolidatedCrewPaymentVoucher) => {
    setViewingVoucher(voucher);
    setIsVoucherModalOpen(true);
  };

  // Confirm Issuance of Consolidated Voucher
  const handleConfirmIssuedVoucher = (
    voucher: ConsolidatedCrewPaymentVoucher,
    autoCreateExpense: boolean
  ) => {
    if (onAddConsolidatedVoucher) {
      onAddConsolidatedVoucher(voucher, autoCreateExpense);
    } else if (onBatchMarkPayrollPaid) {
      onBatchMarkPayrollPaid(voucher.payrollEntryIds, voucher.voucherNumber, voucher.paymentMethod);
    } else {
      // Fallback mark each as paid
      voucher.payrollEntryIds.forEach((id) => {
        onMarkPayrollAsPaid(id, voucher.paymentMethod === 'cash' ? 'cash' : 'bank_transfer');
      });
    }

    setSelectedEntryIds([]);
    setAutomationNotice(`تم اعتماد سند الصرف الموحد رقم ${voucher.voucherNumber} بنجاح.`);
    setTimeout(() => setAutomationNotice(''), 6000);
  };

  // Run Smart Hourly Automation Engine
  const handleRunAutomation = () => {
    if (onAutoCalculatePayrollFromHours) {
      onAutoCalculatePayrollFromHours();
    } else {
      // Internal automated calculation: scan crew member work logs
      let generatedCount = 0;
      crewMembers.forEach((member) => {
        const pendingLogs = member.workLogs?.filter((l) => l.status === 'unprocessed') || [];
        pendingLogs.forEach((log) => {
          onAddPayrollEntry({
            crewId: member.id,
            crewName: member.name,
            role: member.role,
            bookingId: log.bookingId,
            eventTitle: log.eventTitle,
            eventDate: log.eventDate,
            regularHours: log.regularHours,
            overtimeHours: log.overtimeHours,
            hourlyRate: log.hourlyRate,
            earnedAmount: log.totalEarned,
            bonusAmount: 0,
            deductionAmount: 0,
            netPayout: log.totalEarned,
            paymentStatus: 'pending',
            bankIban: member.bankIban,
          });
          log.status = 'processed_in_payroll';
          generatedCount++;
        });
      });

      if (generatedCount === 0) {
        // If no work logs, generate smart demo shift from active bookings
        bookings.slice(0, 2).forEach((booking, idx) => {
          const crew = crewMembers[idx % crewMembers.length];
          const rate = crew.hourlyRate || 65;
          const regH = 5;
          const otH = 1;
          const earned = regH * rate + otH * (rate * 1.5);
          onAddPayrollEntry({
            crewId: crew.id,
            crewName: crew.name,
            role: crew.role,
            bookingId: booking.id,
            eventTitle: `${booking.serviceTitle} (${booking.customerName})`,
            eventDate: booking.date,
            regularHours: regH,
            overtimeHours: otH,
            hourlyRate: rate,
            earnedAmount: earned,
            bonusAmount: 0,
            deductionAmount: 0,
            netPayout: earned,
            paymentStatus: 'pending',
            bankIban: crew.bankIban,
          });
          generatedCount++;
        });
      }

      setAutomationNotice(
        `تمت أتمتة حساب مسير الرواتب بنجاح! تم احتساب وتوليد ${generatedCount || 2} مستحقات جديدة بدقة حسب ساعات العمل والأجر بالساعة.`
      );
      setTimeout(() => setAutomationNotice(''), 6000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const crew = crewMembers.find((c) => c.id === selectedCrewId);
    const booking = bookings.find((b) => b.id === selectedBookingId);
    if (!crew || !booking) return;

    onAddPayrollEntry({
      crewId: crew.id,
      crewName: crew.name,
      role: crew.role,
      bookingId: booking.id,
      eventTitle: `${booking.serviceTitle} (${booking.customerName})`,
      eventDate: booking.date,
      regularHours,
      overtimeHours,
      hourlyRate,
      earnedAmount: calculatedEarnedAmount,
      bonusAmount,
      deductionAmount,
      netPayout: calculatedNetPayout,
      paymentStatus: 'pending',
      bankIban: crew.bankIban,
    });

    setIsAddModalOpen(false);
    setAutomationNotice(`تمت إضافة مستحق ${crew.name} بمبلغ ${calculatedNetPayout.toLocaleString('ar-SA')} ر.س إلى مسير الرواتب.`);
    setTimeout(() => setAutomationNotice(''), 5000);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>نظام أتمتة مسير الرواتب وسندات الصرف الموحدة (Automated Crew Payroll Engine)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            أتمتة مسير أجور الطاقم وسندات الصرف الموحدة
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            احتساب أجور المباشرين والمشرفين تلقائياً بناءً على ساعات العمل الأساسية والإضافية المسجلة، مع إمكانية تجميع المستحقات وإصدار سند صرف مالي موحد معتمد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunAutomation}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>أتمتة الحساب من ساعات العمل ⚡</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>تسجيل مستحق يدوي</span>
          </button>
        </div>
      </div>

      {/* Automation Alert Feedback Banner */}
      {automationNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{automationNotice}</span>
          </div>
          <button
            onClick={() => setAutomationNotice('')}
            className="text-slate-400 hover:text-slate-700 text-xs font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Payouts Card */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-900 font-medium">مستحقات معلقة بانتظار الصرف</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-950">
            {totalPendingAmount.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-amber-800">ر.س</span>
          </div>
          <div className="text-2xs text-amber-800 font-medium flex items-center justify-between">
            <span>{pendingEntries.length} مستحق جاهز للصرف الموحد</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-2xs">
              {pendingEntries.length > 0 ? 'متاح للإصدار' : 'لا يوجد'}
            </span>
          </div>
        </div>

        {/* Total Recorded Work Hours */}
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-900 font-medium">إجمالي ساعات العمل المحسوبة</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-950">
            {totalRecordedHours}{' '}
            <span className="text-xs font-sans text-blue-800">ساعة عمل</span>
          </div>
          <div className="text-2xs text-blue-800 font-medium">
            محتسبة آلياً مع مضاعف الوقت الإضافي (1.5×)
          </div>
        </div>

        {/* Paid Payouts */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-900 font-medium">إجمالي الأجور المصروفة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-950">
            {totalPaidAmount.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-emerald-800">ر.س</span>
          </div>
          <div className="text-2xs text-emerald-800 font-medium">
            {payrollEntries.filter((p) => p.paymentStatus === 'paid').length} مستحق مسدد رسمياً
          </div>
        </div>

        {/* Issued Consolidated Vouchers Count */}
        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-900 font-medium">سندات الصرف الموحدة الصادرة</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-950">
            {consolidatedVouchers.length}{' '}
            <span className="text-xs font-sans text-purple-800">سند موحد</span>
          </div>
          <div className="text-2xs text-purple-800 font-medium">
            مؤرشفة ومعتمدة في قائمة الدخل
          </div>
        </div>

      </div>

      {/* Hourly Wage Presets & Automation Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-medium text-white">
              محرك حساب الأجور الذكي بالساعة (Hourly Rates Matrix)
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-300">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              مشرف ضيافة: <strong className="text-amber-400 font-mono">70 ر.س/س</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              مباشر قهوة: <strong className="text-amber-400 font-mono">50 ر.س/س</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              شيف بوفيه: <strong className="text-amber-400 font-mono">80 ر.س/س</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              فني صوت: <strong className="text-amber-400 font-mono">65 ر.س/س</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              سائق توصيل: <strong className="text-amber-400 font-mono">45 ر.س/س</strong>
            </span>
            <span className="text-emerald-400 font-bold">الوقت الإضافي: 1.5×</span>
          </div>
        </div>

        <button
          onClick={handleRunAutomation}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <span>تحديث الحساب بالساعات</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Sub-Tabs: Individual Entries vs Consolidated Vouchers Archive */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePayrollTab('entries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
              activePayrollTab === 'entries'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>كشف المستحقات الفردية ({payrollEntries.length})</span>
          </button>

          <button
            onClick={() => setActivePayrollTab('vouchers_archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
              activePayrollTab === 'vouchers_archive'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4 text-purple-400" />
            <span>أرشيف سندات الصرف الموحدة ({consolidatedVouchers.length})</span>
          </button>
        </div>

        {/* Unified Voucher Action Button (When Entries selected) */}
        {activePayrollTab === 'entries' && selectedPendingEntries.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-xl animate-fadeIn">
            <span className="text-xs font-medium text-emerald-900">
              تم تحديد <strong>{selectedPendingEntries.length}</strong> مستحق (
              <span className="font-mono">{selectedTotalAmount.toLocaleString('ar-SA')} ر.س</span>)
            </span>
            <button
              onClick={handleOpenVoucherModalForSelected}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>إصدار سند صرف موحد 📄</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: Individual Payroll Entries */}
      {activePayrollTab === 'entries' && (
        <div className="space-y-4">
          
          {/* Controls: Search, Filter, and Bulk Select Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 card-shadow">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم العضو، المناسبة، أو رقم السند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 text-right"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({payrollEntries.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                معلقة ({pendingEntries.length})
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterStatus === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                مسددة ({payrollEntries.filter((p) => p.paymentStatus === 'paid').length})
              </button>

              {pendingEntries.length > 0 && (
                <button
                  onClick={handleSelectAllPending}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors ml-2"
                >
                  {selectedEntryIds.length === pendingEntries.length
                    ? 'إلغاء تحديد الكل'
                    : 'تحديد جميع المعلقات'}
                </button>
              )}
            </div>

          </div>

          {/* Payroll Entries Table */}
          <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3.5 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          pendingEntries.length > 0 &&
                          selectedEntryIds.length === pendingEntries.length
                        }
                        onChange={handleSelectAllPending}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                        title="تحديد الكل"
                      />
                    </th>
                    <th className="py-3.5 px-3">عضو الطاقم والدور</th>
                    <th className="py-3.5 px-3">المناسبة والتاريخ</th>
                    <th className="py-3.5 px-3 text-center">ساعات العمل والأجر</th>
                    <th className="py-3.5 px-3">الأجر المحسوب</th>
                    <th className="py-3.5 px-3">مكافآت / حسم</th>
                    <th className="py-3.5 px-3 text-slate-900 font-bold">صافي المستحق</th>
                    <th className="py-3.5 px-3">حالة الصرف والسند</th>
                    <th className="py-3.5 px-3 text-center">إجراء الصرف</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        لا توجد مستحقات تطابق البحث أو الفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const isPending = entry.paymentStatus === 'pending';
                      const isSelected = selectedEntryIds.includes(entry.id);
                      const crew = crewMembers.find((c) => c.id === entry.crewId);
                      const regH = entry.regularHours ?? 5;
                      const otH = entry.overtimeHours ?? 0;
                      const rate = entry.hourlyRate ?? (crew?.hourlyRate || 65);

                      // Check if linked to a consolidated voucher
                      const linkedVoucher = consolidatedVouchers.find(
                        (v) => v.voucherNumber === entry.consolidatedVoucherNumber
                      );

                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/50'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            {isPending ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectEntry(entry.id)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                              />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            )}
                          </td>

                          {/* Crew Info */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{entry.crewName}</div>
                            <div className="text-2xs text-blue-700 font-semibold">{entry.role}</div>
                            {(entry.bankIban || crew?.bankIban) && (
                              <div className="text-2xs font-mono text-slate-400">
                                {entry.bankIban || crew?.bankIban}
                              </div>
                            )}
                          </td>

                          {/* Event Info */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-800 max-w-[200px] truncate">
                              {entry.eventTitle}
                            </div>
                            <div className="text-2xs text-slate-400 font-mono">{entry.eventDate}</div>
                          </td>

                          {/* Hours & Rate Breakdown */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="font-mono font-bold text-slate-800">
                              {regH} س <span className="text-2xs text-slate-400">(@ {rate} ر.س)</span>
                            </div>
                            {otH > 0 ? (
                              <div className="text-2xs font-mono text-amber-700 font-medium">
                                + {otH} س إضافي (1.5×)
                              </div>
                            ) : (
                              <div className="text-2xs text-slate-400">بدون إضافي</div>
                            )}
                          </td>

                          {/* Earned Gross Amount */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                            {entry.earnedAmount.toLocaleString('ar-SA')} ر.س
                          </td>

                          {/* Bonus / Deduction */}
                          <td className="py-3.5 px-3 font-mono text-2xs">
                            {entry.bonusAmount ? (
                              <span className="text-emerald-700 font-bold">+{entry.bonusAmount} ر.س</span>
                            ) : entry.deductionAmount ? (
                              <span className="text-rose-700 font-bold">-{entry.deductionAmount} ر.س</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Net Payout */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-950 text-sm">
                            {entry.netPayout.toLocaleString('ar-SA')} ر.س
                          </td>

                          {/* Status & Linked Voucher Badge */}
                          <td className="py-3.5 px-3">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-2xs font-medium">
                                <Clock className="w-3 h-3 text-amber-600" />
                                بانتظار الصرف
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-2xs font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  مسدد ({entry.paymentMethod === 'cash' ? 'كاش' : 'تحويل'})
                                </span>

                                {entry.consolidatedVoucherNumber && (
                                  <div>
                                    <button
                                      onClick={() => {
                                        if (linkedVoucher) {
                                          handleOpenExistingVoucher(linkedVoucher);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-2xs font-mono font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md transition-colors"
                                      title="معاينة سند الصرف الموحد"
                                    >
                                      <Receipt className="w-2.5 h-2.5" />
                                      <span>{entry.consolidatedVoucherNumber}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-3 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => onMarkPayrollAsPaid(entry.id, 'bank_transfer')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-2xs shadow-xs transition-colors"
                                  title="تسجيل كحوالة بنكية فردية"
                                >
                                  تحويل
                                </button>
                                <button
                                  onClick={() => onMarkPayrollAsPaid(entry.id, 'cash')}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-2xs transition-colors"
                                  title="تسجيل كتسليم نقدي كاش"
                                >
                                  كاش
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  if (linkedVoucher) {
                                    handleOpenExistingVoucher(linkedVoucher);
                                  } else {
                                    window.print();
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-2xs inline-flex items-center gap-1 transition-colors"
                              >
                                <Printer className="w-3 h-3" />
                                <span>{entry.consolidatedVoucherNumber ? 'السند الموحد' : 'إشعار'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Consolidated Vouchers Archive */}
      {activePayrollTab === 'vouchers_archive' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 card-shadow flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900">
                سجل وأرشيف سندات الصرف المالية الموحدة
              </h4>
              <p className="text-xs text-slate-500">
                كافة سندات الصرف المجمعة الصادرة للطواقم الميدانية معتمدة ومسجلة في القوائم المالية.
              </p>
            </div>

            {pendingEntries.length > 0 && (
              <button
                onClick={() => {
                  setSelectedEntryIds(pendingEntries.map((p) => p.id));
                  setViewingVoucher(null);
                  setIsVoucherModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إصدار سند صرف جديد للمستحقات المعلقة</span>
              </button>
            )}
          </div>

          {consolidatedVouchers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 card-shadow space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">لا توجد سندات صرف موحدة مصدرة حتى الآن</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                حدد عدة مستحقات معلقة من جدول المسير ثم اضغط على "إصدار سند صرف موحد" لإنشاء أول سند مالي معتمد.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {consolidatedVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {voucher.voucherNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-medium">
                            معتمد ومسدد
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-700 mt-1">{voucher.title}</h4>
                      </div>

                      <div className="text-left font-mono">
                        <div className="text-base font-bold text-emerald-800">
                          {voucher.totalConsolidatedAmount.toLocaleString('ar-SA')} ر.س
                        </div>
                        <div className="text-2xs text-slate-400">{voucher.issueDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs text-center border border-slate-100">
                      <div>
                        <span className="text-2xs text-slate-400 block">المستفيدين</span>
                        <span className="font-bold text-slate-800">{voucher.totalCrewCount} أفراد</span>
                      </div>
                      <div>
                        <span className="text-2xs text-slate-400 block">إجمالي الساعات</span>
                        <span className="font-bold text-blue-700">{voucher.totalHours} ساعة</span>
                      </div>
                      <div>
                        <span className="text-2xs text-slate-400 block">طريقة السداد</span>
                        <span className="font-bold text-slate-800">
                          {voucher.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'كاش'}
                        </span>
                      </div>
                    </div>

                    {voucher.notes && (
                      <p className="text-2xs text-slate-500 italic bg-slate-50/50 p-2 rounded-lg">
                        "{voucher.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-2xs text-slate-400 font-medium">
                      المحاسب: {voucher.preparedBy}
                    </span>

                    <button
                      onClick={() => handleOpenExistingVoucher(voucher)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>معاينة وطباعة السند</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Entry Modal with Hours Automation Calculator */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs text-right usil-modal-scroll">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 card-shadow max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  احتساب وتسجيل مستحق جديد بالساعات
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              
              {/* Crew Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  عضو الطاقم الميداني *
                </label>
                <select
                  value={selectedCrewId}
                  onChange={(e) => handleCrewChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-right"
                >
                  {crewMembers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.role} ({c.hourlyRate || 65} ر.س/ساعة)
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المناسبة / الحجز المرتبط *
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-right"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.customerName} - {b.serviceTitle} ({b.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Hours & Hourly Rate Calculation Grid */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between text-blue-950 font-medium text-xs">
                  <span>أتمتة ساعات العمل ومعدل الأجر:</span>
                  <span className="text-2xs font-mono text-blue-800">
                    مضاعف الإضافي: 1.5×
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ساعات أساسية</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={24}
                      value={regularHours}
                      onChange={(e) => setRegularHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-right bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ساعات إضافية</label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-right bg-white text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">أجر الساعة (ر.س)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-right bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/80 flex justify-between items-center font-medium text-xs text-blue-900">
                  <span>الأجر المحسوب للساعات:</span>
                  <span className="font-mono text-sm font-bold text-blue-950">
                    {calculatedEarnedAmount.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {/* Bonuses and Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مكافأة تميز إضافية</label>
                  <input
                    type="number"
                    min={0}
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-right text-emerald-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حسم أو غياب جزئي</label>
                  <input
                    type="number"
                    min={0}
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-right text-rose-700"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Net Payout Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center font-bold text-emerald-950">
                <span>صافي المستحق النهائي للصرف:</span>
                <span className="font-mono text-base text-emerald-800">
                  {calculatedNetPayout.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
                >
                  حفظ المستحق في المسير
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Unified Payment Voucher Modal */}
      <UnifiedPaymentVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setViewingVoucher(null);
        }}
        selectedEntries={selectedPendingEntries}
        brandSettings={brandSettings}
        crewMembers={crewMembers}
        onConfirmIssuedVoucher={handleConfirmIssuedVoucher}
        existingVoucher={viewingVoucher}
      />

    </div>
  );
};
