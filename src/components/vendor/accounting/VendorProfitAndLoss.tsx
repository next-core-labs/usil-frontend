import React, { useState } from 'react';
import { VendorBooking, ExpenseRecord, POSSaleRecord, FinancialPayout } from '../../../types';
import { exportProfitAndLossToExcel } from '../../../utils/excelExporter';
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Receipt,
  Scale,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Download,
  Printer,
  Check,
} from 'lucide-react';

interface VendorProfitAndLossProps {
  bookings: VendorBooking[];
  expenses: ExpenseRecord[];
  posSales: POSSaleRecord[];
  payouts: FinancialPayout[];
  brandName: string;
}

export const VendorProfitAndLoss: React.FC<VendorProfitAndLossProps> = ({
  bookings,
  expenses,
  posSales,
  payouts,
  brandName,
}) => {
  // 1. REVENUE CALCULATIONS
  const externalBookings = bookings.filter((b) => b.source !== 'platform');
  const platformBookings = bookings.filter((b) => b.source === 'platform');

  const externalBookingsRevenue = externalBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const posSalesRevenue = posSales.reduce((sum, s) => sum + s.total, 0);
  const platformGrossRevenue = platformBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformCommission = platformGrossRevenue * 0.15; // 15% platform fee
  const platformNetRevenue = platformGrossRevenue - platformCommission;

  // Total Gross Revenue (Before platform fee deduction)
  const totalGrossRevenue = externalBookingsRevenue + posSalesRevenue + platformGrossRevenue;
  // Total Net Revenue for the merchant
  const totalNetRevenue = externalBookingsRevenue + posSalesRevenue + platformNetRevenue;

  // 2. DIRECT COSTS (COGS - تكلفة تقديم الخدمات والمناسبات)
  const rawMaterialsExpense = expenses
    .filter((e) => e.category === 'raw_materials')
    .reduce((sum, e) => sum + e.amount, 0);

  const directLaborExpense = expenses
    .filter((e) => e.category === 'direct_labor')
    .reduce((sum, e) => sum + e.amount, 0);

  const transportExpense = expenses
    .filter((e) => e.category === 'fuel_transport')
    .reduce((sum, e) => sum + e.amount, 0);

  const packagingExpense = expenses
    .filter((e) => e.category === 'packaging_disposables')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDirectCosts =
    rawMaterialsExpense + directLaborExpense + transportExpense + packagingExpense + platformCommission;

  // 3. GROSS PROFIT (إجمالي الربح التشغيلي للمناسبات)
  const grossProfit = totalGrossRevenue - totalDirectCosts;
  const grossMarginPercent = totalGrossRevenue > 0 ? (grossProfit / totalGrossRevenue) * 100 : 0;

  // 4. OPERATING EXPENSES (OPEX - المصاريف الإدارية والتشغيلية الثابتة)
  const maintenanceExpense = expenses
    .filter((e) => e.category === 'maintenance_tools')
    .reduce((sum, e) => sum + e.amount, 0);

  const marketingExpense = expenses
    .filter((e) => e.category === 'marketing_ads')
    .reduce((sum, e) => sum + e.amount, 0);

  const rentUtilitiesExpense = expenses
    .filter((e) => e.category === 'utilities_rent')
    .reduce((sum, e) => sum + e.amount, 0);

  const otherPettyCashExpense = expenses
    .filter((e) => e.category === 'other_petty_cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOperatingExpenses =
    maintenanceExpense + marketingExpense + rentUtilitiesExpense + otherPettyCashExpense;

  // 5. NET PROFIT (صافي الربح الفعلي النهائي)
  const netIncome = grossProfit - totalOperatingExpenses;
  const netMarginPercent = totalGrossRevenue > 0 ? (netIncome / totalGrossRevenue) * 100 : 0;

  // Total commission saved by using 0% tools
  const commissionSavedOnZeroPercent = (externalBookingsRevenue + posSalesRevenue) * 0.15;

  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportProfitAndLossToExcel({
        brandName: brandName || 'مؤسسة الضيافة',
        period: 'أغسطس 2026',
        totalGrossRevenue,
        externalBookingsRevenue,
        posSalesRevenue,
        platformGrossRevenue,
        platformCommission,
        platformNetRevenue,
        totalDirectCosts,
        rawMaterialsExpense,
        directLaborExpense,
        transportExpense,
        packagingExpense,
        grossProfit,
        grossMarginPercent,
        totalOperatingExpenses,
        maintenanceExpense,
        otherPettyCashExpense,
        netIncome,
        netMarginPercent,
        commissionSaved: commissionSavedOnZeroPercent,
        bookings,
        expenses,
        posSales,
      });
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting P&L excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Banner & Insight */}
      <div className="p-5 rounded-3xl bg-linear-to-l from-slate-900 via-slate-800 to-slate-900 text-white card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-medium border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>قائمة الدخل والربحية الفورية • شهر أغسطس 2026</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            بيان الأرباح والخسائر الشامل (P&L Income Statement)
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            حساب فوري لكافة إيرادات المناسبات، وتكاليف الخامات والعمالة، والمصروفات النثرية لتحديد صافي ربحك الحقيقي بدقة متناهية دون الحاجة لانتظار نهاية الشهر.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Export Report Excel Action Button in Top Banner */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all border border-emerald-400/30 cursor-pointer disabled:opacity-75"
            title="تصدير تقرير قائمة الدخل والمصاريف والإيرادات كملف Excel (XLSX) معتمد" aria-label="تصدير تقرير قائمة الدخل والمصاريف والإيرادات كملف Excel (XLSX) معتمد"
          >
            {exportedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>تم التصدير بنجاح!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>تصدير التقرير (Excel)</span>
                <Download className="w-3.5 h-3.5 text-white/80" />
              </>
            )}
          </button>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
            <span className="text-2xs text-slate-400 block mb-1">هامش الربح الصافي</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              %{netMarginPercent.toFixed(1)}
            </div>
            <span className="text-2xs text-emerald-300/80 font-medium">معدل ممتاز</span>
          </div>
        </div>
      </div>

      {/* 4 High-Level Key Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">إجمالي الإيرادات (المبيعات)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalGrossRevenue.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-2xs text-slate-500 flex items-center gap-1">
            <span className="text-blue-600 font-bold">{bookings.length + posSales.length} عملية بيع</span>
            <span>(خارجي + كاشير + منصة)</span>
          </div>
        </div>

        {/* Metric 2: Direct Costs (COGS) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">تكلفة تقديم الخدمات (COGS)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {totalDirectCosts.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-2xs text-slate-500">
            خامات، عمالة مباشرة، وقود، ومستهلكات
          </div>
        </div>

        {/* Metric 3: Gross Profit */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">إجمالي الربح التشغيلي</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {grossProfit.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-2xs text-emerald-600 font-medium flex items-center gap-1">
            <span>هامش إجمالي: %{grossMarginPercent.toFixed(1)}</span>
          </div>
        </div>

        {/* Metric 4: Net Profit (Final) */}
        <div className="p-5 rounded-2xl bg-emerald-950 text-white card-shadow space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">صافي الربح الحقيقي (Net Profit)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {netIncome.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-emerald-300">ر.س</span>
          </div>
          <div className="text-2xs text-emerald-200 flex items-center justify-between">
            <span>بعد خصم كافة المصروفات</span>
            <span className="font-mono font-bold">%{netMarginPercent.toFixed(1)}</span>
          </div>
        </div>

      </div>

      {/* Structured P&L Table (قائمة الدخل الاحترافية بالتفصيل) */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-bold text-slate-900">
              جدول قائمة الدخل التفصيلية (Income Statement Breakdown)
            </h4>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 hidden md:inline">المبالغ بالريال السعودي (SAR)</span>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تصدير جدول الأرباح والخسائر إلى Excel" aria-label="تصدير جدول الأرباح والخسائر إلى Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير التقرير (Excel)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="طباعة تقرير قائمة الدخل"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          
          {/* SECTION 1: REVENUES */}
          <div className="bg-slate-50/80 px-6 py-2.5 font-bold text-slate-700 flex items-center justify-between">
            <span>1. الإيرادات التشغيلية والمبيعات (Revenues)</span>
            <span className="font-mono text-slate-900 font-bold">
              +{totalGrossRevenue.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• إيرادات الحجوزات المباشرة والخارجية (عمولة 0%)</span>
            <span className="font-mono font-bold text-slate-800">
              {externalBookingsRevenue.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• مبيعات كاشير المعرض ونقاط البيع POS (عمولة 0%)</span>
            <span className="font-mono font-bold text-slate-800">
              {posSalesRevenue.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• مبيعات منصة يوصل العامة (قبل استقطاع عمولة المنصة 15%)</span>
            <span className="font-mono font-bold text-slate-800">
              {platformGrossRevenue.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          {/* SECTION 2: COST OF GOODS & SERVICES (COGS) */}
          <div className="bg-amber-50/70 px-6 py-2.5 font-bold text-amber-900 flex items-center justify-between">
            <span>2. التكاليف المباشرة للمناسبات وتوريد الخدمات (Cost of Sales / COGS)</span>
            <span className="font-mono text-amber-900 font-bold">
              -{totalDirectCosts.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• مشتريات الخامات والمواد الغذائية (بن، تمور، لحوم، فواكه)</span>
            <span className="font-mono text-amber-800">
              -{rawMaterialsExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• أجور العمالة المباشرة والمباشرين الإضافيين باليومية</span>
            <span className="font-mono text-amber-800">
              -{directLaborExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• مصاريف الوقود والنقل الميداني والشاحنات</span>
            <span className="font-mono text-amber-800">
              -{transportExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• مستهلكات وتغليف (فناجيل، علب، ملاعق ومفارش استهلاكية)</span>
            <span className="font-mono text-amber-800">
              -{packagingExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• عمولة وساطة منصة يوصل (15% على طلبات المنصة فقط)</span>
            <span className="font-mono text-amber-800">
              -{platformCommission.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          {/* SUB-TOTAL: GROSS PROFIT */}
          <div className="bg-emerald-50 px-6 py-3 font-bold text-emerald-950 flex items-center justify-between border-y border-emerald-200">
            <span>= إجمالي الربح التشغيلي (Gross Profit)</span>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-medium">
                هامش %{grossMarginPercent.toFixed(1)}
              </span>
              <span className="font-mono text-base text-emerald-800 font-bold">
                {grossProfit.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>

          {/* SECTION 3: OPERATING EXPENSES (OPEX) */}
          <div className="bg-slate-50/80 px-6 py-2.5 font-bold text-slate-700 flex items-center justify-between">
            <span>3. المصروفات التشغيلية والإدارية (Operating Expenses / OPEX)</span>
            <span className="font-mono text-slate-900 font-bold">
              -{totalOperatingExpenses.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• صيانة المعدات والدلال والمغاسل المركزية</span>
            <span className="font-mono text-slate-700">
              -{maintenanceExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
            <span className="text-slate-600 pr-4">• نثريات وضيافة العهد الداخلية</span>
            <span className="font-mono text-slate-700">
              -{otherPettyCashExpense.toLocaleString('ar-SA')} ر.س
            </span>
          </div>

          {/* FINAL RESULT: NET PROFIT */}
          <div className="bg-slate-900 text-white px-6 py-4 font-bold text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>صافي الدخل والربح الفعلي للمنشأة (Net Profit)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                هامش الصافي %{netMarginPercent.toFixed(1)}
              </span>
              <span className="font-mono text-xl text-emerald-400 font-bold">
                {netIncome.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Savings & Merchant Protection Callout */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-medium text-emerald-900">
              توفير مالي حقيقي بفضل أدوات يوصل المجانية (0% عمولة)
            </h5>
            <p className="text-2xs sm:text-xs text-emerald-800">
              باستخدامك لكاشير المعرض، روابط البايو، وفواتير الهوية الخاصة، وفرت منشأتك{' '}
              <strong className="font-mono underline font-bold">
                {commissionSavedOnZeroPercent.toLocaleString('ar-SA')} ر.س
              </strong>{' '}
              كانت ستستقطعها منصات وتطبيقات الوساطة التقليدية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
