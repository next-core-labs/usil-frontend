import * as XLSX from 'xlsx';
import { VendorBooking, ExpenseRecord, POSSaleRecord, ExpenseCategory } from '../types';

export interface ProfitAndLossExportData {
  brandName: string;
  period: string;
  totalGrossRevenue: number;
  externalBookingsRevenue: number;
  posSalesRevenue: number;
  platformGrossRevenue: number;
  platformCommission: number;
  platformNetRevenue: number;
  totalDirectCosts: number;
  rawMaterialsExpense: number;
  directLaborExpense: number;
  transportExpense: number;
  packagingExpense: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalOperatingExpenses: number;
  maintenanceExpense: number;
  otherPettyCashExpense: number;
  netIncome: number;
  netMarginPercent: number;
  commissionSaved: number;
  bookings: VendorBooking[];
  expenses: ExpenseRecord[];
  posSales: POSSaleRecord[];
}

const expenseCategoryNames: Record<ExpenseCategory, string> = {
  raw_materials: 'خامات ومواد تموينية (بن، تمور، فواكه، لحوم)',
  inventory_supplies: 'توريدات ومستلزمات المخزون والمستودع',
  direct_labor: 'عمالة مؤقتة ومباشرين باليومية',
  crew_wages: 'مسير أجور الطاقم وسندات الصرف الموحدة',
  fuel_transport: 'وقود، نقل، مشاوير ميدانية',
  maintenance_tools: 'صيانة عتاد وأدوات ضيافة ومغاسل',
  packaging_disposables: 'مستهلكات وتغليف وفناجيل استهلاكية',
  marketing_ads: 'إعلانات وتسويق',
  utilities_rent: 'إيجار مستودع/معرض وكهرباء وإنترنت',
  other_petty_cash: 'نثريات وضيافة داخلية وعهد',
};

export function exportProfitAndLossToExcel(data: ProfitAndLossExportData) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: ملخص قائمة الدخل (P&L Summary)
  const summaryRows: any[][] = [
    ['تقرير قائمة الدخل والأرباح والخسائر الشامل (P&L Income Statement)'],
    ['اسم المنشأة / المورّد:', data.brandName],
    ['الفترة المالية:', data.period],
    ['تاريخ التصدير:', new Date().toLocaleDateString('ar-SA')],
    ['العملة المعتمدة:', 'ريال سعودي (SAR)'],
    [],
    ['البند المالي (Financial Item)', 'التصنيف المحاسبي', 'المبلغ (SAR)', 'النسبة من الإيراد (%)'],
    
    // Revenues
    ['1. إجمالي الإيرادات والمبيعات التشغيلية', 'Revenues', data.totalGrossRevenue, '100%'],
    ['• إيرادات الحجوزات المباشرة والخارجية (عمولة 0%)', 'Direct Bookings', data.externalBookingsRevenue, `${data.totalGrossRevenue ? ((data.externalBookingsRevenue / data.totalGrossRevenue) * 100).toFixed(1) : 0}%`],
    ['• مبيعات كاشير المعرض ونقاط البيع POS (عمولة 0%)', 'POS Sales', data.posSalesRevenue, `${data.totalGrossRevenue ? ((data.posSalesRevenue / data.totalGrossRevenue) * 100).toFixed(1) : 0}%`],
    ['• مبيعات منصة يوصل العامة (قبل العمولة)', 'Platform Gross', data.platformGrossRevenue, `${data.totalGrossRevenue ? ((data.platformGrossRevenue / data.totalGrossRevenue) * 100).toFixed(1) : 0}%`],
    [],

    // COGS
    ['2. التكاليف المباشرة لتوريد المناسبات (Cost of Sales / COGS)', 'Direct Costs', -data.totalDirectCosts, `${data.totalGrossRevenue ? ((data.totalDirectCosts / data.totalGrossRevenue) * 100).toFixed(1) : 0}%`],
    ['• مشتريات الخامات والمواد الغذائية', 'Raw Materials', -data.rawMaterialsExpense, ''],
    ['• أجور العمالة المباشرة والميدانية', 'Direct Labor', -data.directLaborExpense, ''],
    ['• مصاريف الوقود والنقل الميداني', 'Fuel & Logistics', -data.transportExpense, ''],
    ['• مستهلكات التغليف والضيافة', 'Packaging', -data.packagingExpense, ''],
    ['• عمولة منصة يوصل (15% على طلبات المنصة فقط)', 'Platform Fee (15%)', -data.platformCommission, ''],
    [],

    // Gross Profit
    ['= إجمالي الربح التشغيلي (Gross Profit)', 'Gross Profit', data.grossProfit, `${data.grossMarginPercent.toFixed(1)}%`],
    [],

    // OPEX
    ['3. المصروفات التشغيلية والإدارية (OPEX)', 'Operating Expenses', -data.totalOperatingExpenses, `${data.totalGrossRevenue ? ((data.totalOperatingExpenses / data.totalGrossRevenue) * 100).toFixed(1) : 0}%`],
    ['• صيانة المعدات والدلال والمغاسل', 'Maintenance', -data.maintenanceExpense, ''],
    ['• نثريات وضيافة العهد الداخلية', 'Petty Cash', -data.otherPettyCashExpense, ''],
    [],

    // Net Profit
    ['= صافي الربح الحقيقي للمنشأة (Net Profit)', 'Net Income', data.netIncome, `${data.netMarginPercent.toFixed(1)}%`],
    [],
    ['* وفر مالي بفضل أدوات العمولة الصفرية 0%:', 'Commission Savings', data.commissionSaved, ''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  
  // Set column widths
  wsSummary['!cols'] = [
    { wch: 55 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'قائمة الدخل P&L');

  // 2. Sheet 2: سجل الإيرادات والحجوزات (Revenues Breakdown)
  const revenuesHeaders = [
    'رقم المعاملة / الحجز',
    'المصدر (Channel Source)',
    'اسم العميل / المناسبة',
    'الخدمة المطلوبة',
    'تاريخ المناسبة',
    'المبلغ الإجمالي (SAR)',
    'حالة الحجز',
  ];

  const bookingRows = data.bookings.map((b) => [
    b.bookingNumber || b.id,
    b.source === 'platform' ? 'منصة يوصل (15%)' : 'حجز خارجي مباشر (0% عمولة)',
    b.customerName || 'عميل حجز',
    b.serviceTitle || 'خدمة ضيافة',
    b.date || '',
    b.totalAmount || 0,
    b.status === 'completed' ? 'مكتمل ومستلم' : b.status === 'confirmed' ? 'مؤكد' : 'قيد التنفيذ',
  ]);

  const posRows = data.posSales.map((p) => [
    p.receiptNumber || p.id,
    'كاشير المعرض POS (0% عمولة)',
    p.customerName || 'عميل كاشير',
    'مبيعات مباشرة / نقاط البيع',
    p.eventDate || p.createdAt?.split('T')[0] || '',
    p.total || 0,
    'مدفوع ومكتمل',
  ]);

  const allRevenueRows = [
    ['سجل الإيرادات والمبيعات والحجوزات التفصيلي'],
    ['اسم المنشأة:', data.brandName],
    ['إجمالي إيراد الحجوزات والكاشير:', `${data.totalGrossRevenue.toLocaleString('ar-SA')} ر.س`],
    [],
    revenuesHeaders,
    ...bookingRows,
    ...posRows,
  ];

  const wsRevenues = XLSX.utils.aoa_to_sheet(allRevenueRows);
  wsRevenues['!cols'] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 25 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRevenues, 'تفاصيل الإيرادات');

  // 3. Sheet 3: سجل المصروفات التفصيلي (Expenses Breakdown)
  const expenseHeaders = [
    'رقم سند الصرف',
    'التصنيف المحاسبي',
    'بيان المصروف',
    'الجهة المستفيدة / المورّد',
    'المبلغ (SAR)',
    'ضريبة القيمة المضافة (15%)',
    'الإجمالي مع الضريبة (SAR)',
    'التاريخ',
    'طريقة السداد',
    'النوع المالي',
  ];

  const expenseRows = data.expenses.map((e) => [
    e.voucherNumber || e.id,
    expenseCategoryNames[e.category] || e.category,
    e.title || 'مصروف تشغيلي',
    e.paidTo || 'مورّد',
    e.amount || 0,
    e.taxAmount || 0,
    e.totalAmount || e.amount || 0,
    e.date || '',
    e.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : e.paymentMethod === 'cash' ? 'نقداً' : e.paymentMethod === 'petty_cash' ? 'عهدة نقدية' : 'مدى / شبكة',
    ['raw_materials', 'direct_labor', 'crew_wages', 'fuel_transport', 'packaging_disposables'].includes(e.category)
      ? 'تكلفة مباشرة (COGS)'
      : 'مصروف تشغيلي (OPEX)',
  ]);

  const allExpenseRows = [
    ['سجل المصروفات والتكاليف وتوريد المناسبات التفصيلي'],
    ['اسم المنشأة:', data.brandName],
    ['إجمالي المصروفات المسجلة:', `${(data.totalDirectCosts + data.totalOperatingExpenses).toLocaleString('ar-SA')} ر.س`],
    [],
    expenseHeaders,
    ...expenseRows,
  ];

  const wsExpenses = XLSX.utils.aoa_to_sheet(allExpenseRows);
  wsExpenses['!cols'] = [
    { wch: 18 },
    { wch: 32 },
    { wch: 32 },
    { wch: 25 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'تفاصيل المصروفات');

  // Generate and download Excel file
  const safeBrand = (data.brandName || 'Vendor').replace(/\s+/g, '-');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `قائمة-الدخل-والأرباح-${safeBrand}-${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
