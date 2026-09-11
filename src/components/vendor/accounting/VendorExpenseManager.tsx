import React, { useState } from 'react';
import { ExpenseRecord, ExpenseCategory, VendorBooking } from '../../../types';
import {
  Plus,
  Receipt,
  Search,
  Filter,
  Trash2,
  Printer,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface VendorExpenseManagerProps {
  expenses: ExpenseRecord[];
  bookings: VendorBooking[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'voucherNumber'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const CATEGORY_LABELS: Record<
  ExpenseCategory,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  raw_materials: { label: 'خامات ومواد غذائية (بن، تمور، لحوم)', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
  inventory_supplies: { label: 'توريدات ومستلزمات المخزون والمستودع', icon: Package, color: 'text-teal-700 bg-teal-50' },
  direct_labor: { label: 'عمالة مؤقتة ومباشرين باليومية', icon: Users, color: 'text-blue-600 bg-blue-50' },
  crew_wages: { label: 'مسير أجور وسندات صرف الطاقم الموحدة', icon: Users, color: 'text-emerald-700 bg-emerald-50' },
  fuel_transport: { label: 'وقود، نقل وشاحنات', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
  packaging_disposables: { label: 'مستهلكات، فناجيل وتغليف', icon: Package, color: 'text-emerald-600 bg-emerald-50' },
  maintenance_tools: { label: 'صيانة عتاد، دلال وغسيل', icon: Wrench, color: 'text-purple-600 bg-purple-50' },
  marketing_ads: { label: 'تسويق وإعلانات', icon: Sparkles, color: 'text-pink-600 bg-pink-50' },
  utilities_rent: { label: 'إيجار مستودع/معرض وكهرباء', icon: Layers, color: 'text-slate-600 bg-slate-100' },
  other_petty_cash: { label: 'نثريات وضيافة داخلية (عهدة)', icon: Receipt, color: 'text-orange-600 bg-orange-50' },
};

export const VendorExpenseManager: React.FC<VendorExpenseManagerProps> = ({
  expenses,
  bookings,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('raw_materials');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.15);
  const [paymentMethod, setPaymentMethod] = useState<ExpenseRecord['paymentMethod']>('mada');
  const [paidTo, setPaidTo] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [relatedBookingId, setRelatedBookingId] = useState('');

  // Calculations
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalInputTaxDeductible = expenses.reduce((sum, e) => sum + e.taxAmount, 0);
  const rawMaterialsTotal = expenses
    .filter((e) => e.category === 'raw_materials')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchPaidTo = e.paidTo.toLowerCase().includes(q);
      const matchVoucher = e.voucherNumber.toLowerCase().includes(q);
      const matchInvRef = e.invoiceReference?.toLowerCase().includes(q);
      if (!matchTitle && !matchPaidTo && !matchVoucher && !matchInvRef) return false;
    }
    return true;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0 || !paidTo) return;

    const calculatedTax = amount * taxRate;
    const total = amount + calculatedTax;

    onAddExpense({
      title,
      category,
      amount,
      taxRate,
      taxAmount: calculatedTax,
      totalAmount: total,
      paymentMethod,
      paidTo,
      invoiceReference: invoiceReference || undefined,
      date,
      notes: notes || undefined,
      relatedBookingId: relatedBookingId || undefined,
    });

    // Reset Form
    setTitle('');
    setAmount(0);
    setPaidTo('');
    setInvoiceReference('');
    setNotes('');
    setRelatedBookingId('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-200">
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            <span>سندات الصرف والمصروفات والعهد النثرية (Expenses & Petty Cash)</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            إدارة النفقات التشغيلية والمشتريات والعهد الميدانية
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            سجل دقيق لجميع فواتير المشتريات، البنزين، والعمالة المؤقتة مع فرز ضريبة المدخلات القابلة للاسترداد من هيئة الزكاة.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>إصدار سند صرف جديد</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5">
          <span className="text-xs text-slate-500 font-bold">إجمالي المصروفات والنفقات (شامل الضريبة)</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {totalExpensesAmount.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-500">
            عدد السندات: <span className="font-bold text-slate-800">{expenses.length} سند صرف</span>
          </div>
        </div>

        {/* Input VAT to deduct */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-900 font-bold">ضريبة المدخلات القابلة للاسترداد (15%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-950">
            {totalInputTaxDeductible.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-emerald-800">ر.س</span>
          </div>
          <div className="text-[11px] text-emerald-800">
            تُخصم مباشرة من ضريبة المبيعات في إقرار الزكاة
          </div>
        </div>

        {/* Raw Materials Total */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 card-shadow space-y-1.5">
          <span className="text-xs text-amber-900 font-bold">مشتريات الخامات والمواد التموينية</span>
          <div className="text-2xl font-extrabold font-mono text-amber-950">
            {rawMaterialsTotal.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-amber-800">ر.س</span>
          </div>
          <div className="text-[11px] text-amber-800">
            بن خولاني، تمور ملكية، لحوم، وفواكه
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 card-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع المصروفات ({expenses.length})
          </button>

          {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
            const count = expenses.filter((e) => e.category === catKey).length;
            if (count === 0 && selectedCategoryFilter !== catKey) return null;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryFilter(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  selectedCategoryFilter === catKey
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{catInfo.label.split('(')[0]}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالبند، المورّد، أو رقم السند..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </div>

      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم السند والتاريخ</th>
                <th className="py-3.5 px-4">بيان وبند المصروف</th>
                <th className="py-3.5 px-4">التصنيف المحاسبي</th>
                <th className="py-3.5 px-4">المدفوع له (المورّد)</th>
                <th className="py-3.5 px-4">المبلغ قبل الضريبة</th>
                <th className="py-3.5 px-4">ضريبة المدخلات 15%</th>
                <th className="py-3.5 px-4 text-slate-900">المجموع الإجمالي</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد سندات صرف مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const catMeta = CATEGORY_LABELS[expense.category] || CATEGORY_LABELS.other_petty_cash;
                  const Icon = catMeta.icon;

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Voucher Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{expense.voucherNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{expense.date}</div>
                      </td>

                      {/* Title & Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-800">{expense.title}</div>
                        {expense.notes && (
                          <div className="text-[10px] text-slate-500 truncate">{expense.notes}</div>
                        )}
                        {expense.relatedBookingId && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                            مرتبط بمناسبة {expense.relatedBookingId}
                          </span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${catMeta.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{catMeta.label.split('(')[0]}</span>
                        </span>
                      </td>

                      {/* Paid To */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{expense.paidTo}</div>
                        {expense.invoiceReference && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            فاتورة: {expense.invoiceReference}
                          </div>
                        )}
                      </td>

                      {/* Amount Before Tax */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {expense.amount.toLocaleString('ar-SA')} ر.س
                      </td>

                      {/* Tax Amount */}
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                        {expense.taxAmount > 0 ? `+${expense.taxAmount.toLocaleString('ar-SA')} ر.س` : 'معفى (0%)'}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">
                        {expense.totalAmount.toLocaleString('ar-SA')} ر.س
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        {expense.paymentMethod === 'mada' && 'شبكة مدى'}
                        {expense.paymentMethod === 'petty_cash' && 'عهدة نقدية (كاش)'}
                        {expense.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                        {expense.paymentMethod === 'cash' && 'نقداً'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                            title="طباعة سند الصرف"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(expense.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 text-right card-shadow my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  إصدار سند صرف وقيد مصروف جديد (Payment Voucher)
                </h4>
                <p className="text-xs text-slate-500">
                  تسجيل فواتير المشتريات، العهد النقدية، أو أجور المباشرين
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  بيان وعنوان المصروف *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء كرتون بن خولاني فاخر 10 كجم"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    التصنيف المحاسبي *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-blue-500 focus:outline-none text-right"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                      <option key={catKey} value={catKey}>
                        {catInfo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المدفوع له (المورّد / المحل) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محامص البن العربي"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المبلغ قبل الضريبة (ر.س) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:border-blue-500 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    نسبة ضريبة القيمة المضافة *
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-blue-500 focus:outline-none text-right"
                  >
                    <option value={0.15}>15% (النسبة الأساسية - ضريبة مدخلات)</option>
                    <option value={0}>0% (معفى ضريبياً / عمالة فردية / خضار وفواكه)</option>
                  </select>
                </div>
              </div>

              {/* Total calculation preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span>الإجمالي شامل الضريبة:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  {(amount + amount * taxRate).toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    طريقة الدفع *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-blue-500 focus:outline-none text-right"
                  >
                    <option value="mada">بطاقة مدى / بنكية</option>
                    <option value="petty_cash">عهدة نقدية ميدانية (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="cash">نقداً</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    تاريخ الصرف *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:border-blue-500 focus:outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رقم فاتورة المورّد الضريبية (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: INV-99882"
                    value={invoiceReference}
                    onChange={(e) => setInvoiceReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ربط بمناسبة معينة (لحساب ربحيتها)
                  </label>
                  <select
                    value={relatedBookingId}
                    onChange={(e) => setRelatedBookingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-blue-500 focus:outline-none text-right"
                  >
                    <option value="">-- مصروف عام للمنشأة --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.customerName} ({b.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات حول سبب الصرف..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none text-right"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-colors"
                >
                  حفظ وتسجيل سند الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
