import React, { useState } from 'react';
import { VendorInvoice, ExpenseRecord, POSSaleRecord, VendorBrandSettings } from '../../../types';
import {
  FileCheck2,
  Building,
  Printer,
  Copy,
  CheckCircle2,
  Sparkles,
  Download,
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface VendorZatcaVatReportProps {
  invoices: VendorInvoice[];
  expenses: ExpenseRecord[];
  posSales: POSSaleRecord[];
  brandSettings: VendorBrandSettings;
}

export const VendorZatcaVatReport: React.FC<VendorZatcaVatReportProps> = ({
  invoices,
  expenses,
  posSales,
  brandSettings,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<'Q3' | 'Q2' | 'Q1' | 'Q4'>('Q3');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Calculate Taxable Sales (المبيعات الخاضعة للنسبة الأساسية 15%)
  // From Invoices:
  const invoicesSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const invoicesVat = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  // From POS Sales:
  const posSubtotal = posSales.reduce((sum, s) => sum + s.subtotal, 0);
  const posVat = posSales.reduce((sum, s) => sum + s.taxAmount, 0);

  const totalTaxableSales = invoicesSubtotal + posSubtotal;
  const totalSalesOutputTax = invoicesVat + posVat; // ضريبة المخرجات

  // 2. Calculate Taxable Purchases & Expenses (المشتريات والمصروفات الخاضعة للنسبة الأساسية 15%)
  const standardRateExpenses = expenses.filter((e) => e.taxRate > 0);
  const exemptExpenses = expenses.filter((e) => e.taxRate === 0);

  const taxablePurchases = standardRateExpenses.reduce((sum, e) => sum + e.amount, 0);
  const purchasesInputTax = standardRateExpenses.reduce((sum, e) => sum + e.taxAmount, 0); // ضريبة المدخلات

  const exemptPurchases = exemptExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 3. Net VAT Payable to ZATCA (صافي الضريبة المستحقة للهيئة)
  // Net VAT = Output Tax - Input Tax
  const netVatPayable = totalSalesOutputTax - purchasesInputTax;

  const handleCopyValue = (val: string | number, fieldKey: string) => {
    navigator.clipboard.writeText(String(val));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 3000);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>نظام إقرار ضريبة القيمة المضافة ZATCA التلقائي (15% VAT Ledger)</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            ملخص الإقرار الضريبي لهيئة الزكاة والضريبة والجمارك
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            حساب فوري مطابق للنموذج الضريبي الرسمي لهيئة الزكاة: ضريبة المخرجات - ضريبة المدخلات = صافي الضريبة الواجب سدادها.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quarter Selector */}
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 font-medium text-xs border border-slate-200 text-slate-800 focus:outline-none"
          >
            <option value="Q3">الربع الثالث 2026 (يوليو - سبتمبر)</option>
            <option value="Q2">الربع الثاني 2026 (أبريل - يونيو)</option>
            <option value="Q1">الربع الأول 2026 (يناير - مارس)</option>
            <option value="Q4">الربع الرابع 2026 (أكتوبر - ديسمبر)</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الإقرار</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Output VAT (المبيعات) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">1. ضريبة المخرجات المحصلة (المبيعات)</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-2xs font-medium">15% VAT</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalSalesOutputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-2xs text-slate-500">
            من إجمالي مبيعات: {totalTaxableSales.toLocaleString('ar-SA')} ر.س
          </div>
        </div>

        {/* Input VAT (المشتريات) */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-900 font-medium">2. ضريبة المدخلات القابلة للخصم (المشتريات)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-950">
            {purchasesInputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans text-emerald-800">ر.س</span>
          </div>
          <div className="text-2xs text-emerald-800">
            من مشتريات خاضعة: {taxablePurchases.toLocaleString('ar-SA')} ر.س
          </div>
        </div>

        {/* Net VAT Payable */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white card-shadow space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">3. صافي الضريبة المستحقة للهيئة (ZATCA)</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {netVatPayable.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans text-emerald-400">ر.س</span>
          </div>
          <div className="text-2xs text-slate-300">
            المبلغ الواجب سداده عبر سداد قبل نهاية الفترة
          </div>
        </div>

      </div>

      {/* Official ZATCA VAT Return Form Table (مطابق لنموذج الهيئة الرسمي) */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        
        {/* Form Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-base font-bold text-slate-900">
                نموذج إقرار ضريبة القيمة المضافة - هيئة الزكاة والضريبة والجمارك
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              المنشأة: {brandSettings.brandName} • الرقم الضريبي: <span className="font-mono font-bold text-slate-800">{brandSettings.vatNumber}</span>
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            الفترة الضريبية: الربع الثالث 2026
          </div>
        </div>

        {/* Table Structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">البند</th>
                <th className="py-3 px-4">بيان المعاملة الضريبية</th>
                <th className="py-3 px-4">المبلغ الخاضع للضريبة (SAR)</th>
                <th className="py-3 px-4">مبلغ الضريبة 15% (SAR)</th>
                <th className="py-3 px-4 text-center">نسخ للبوابة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              
              {/* SECTION A: SALES */}
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td colSpan={5} className="py-2.5 px-4 text-blue-900">
                  أولاً: المبيعات الخاضعة لضريبة القيمة المضافة (ضريبة المخرجات)
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">1</td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">المبيعات الخاضعة للنسبة الأساسية (15%)</div>
                  <div className="text-2xs text-slate-500">مبيعات عقود الضيافة، الكاشير، والبوفيهات</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                  {totalTaxableSales.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                  {totalSalesOutputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleCopyValue(totalSalesOutputTax.toFixed(2), 'sales_vat')}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-2xs font-medium text-slate-700 inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'sales_vat' ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">2</td>
                <td className="py-3 px-4 text-slate-600">المبيعات المحلية الخاضعة للنسبة الصفرية (0%)</td>
                <td className="py-3 px-4 font-mono text-slate-500">0.00</td>
                <td className="py-3 px-4 font-mono text-slate-500">0.00</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
              </tr>

              {/* Total Sales Output VAT */}
              <tr className="bg-blue-50/60 font-bold">
                <td className="py-3 px-4 text-center text-blue-900">3</td>
                <td className="py-3 px-4 text-blue-950 font-bold">إجمالي ضريبة المخرجات المحصلة</td>
                <td className="py-3 px-4 font-mono font-bold text-blue-950">
                  {totalTaxableSales.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-blue-950 text-sm">
                  {totalSalesOutputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center text-blue-800 font-bold">✓ معتمد</td>
              </tr>

              {/* SECTION B: PURCHASES */}
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td colSpan={5} className="py-2.5 px-4 text-emerald-900">
                  ثانياً: المشتريات والمصروفات الخاضعة لضريبة القيمة المضافة (ضريبة المدخلات)
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">4</td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">المشتريات الخاضعة للنسبة الأساسية (15%)</div>
                  <div className="text-2xs text-slate-500">فواتير بن، وقود، صيانة، وتغليف ضريبية من الموردين</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                  {taxablePurchases.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                  {purchasesInputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleCopyValue(purchasesInputTax.toFixed(2), 'purchases_vat')}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-2xs font-medium text-slate-700 inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'purchases_vat' ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">5</td>
                <td className="py-3 px-4 text-slate-600">المشتريات المعفاة من الضريبة (تمور، خضار وفواكه طازجة)</td>
                <td className="py-3 px-4 font-mono text-slate-700">{exemptPurchases.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4 font-mono text-slate-500">0.00</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
              </tr>

              {/* Total Input VAT */}
              <tr className="bg-emerald-50/60 font-bold">
                <td className="py-3 px-4 text-center text-emerald-900">6</td>
                <td className="py-3 px-4 text-emerald-950 font-bold">إجمالي ضريبة المدخلات القابلة للخصم</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                  {(taxablePurchases + exemptPurchases).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-950 text-sm">
                  {purchasesInputTax.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center text-emerald-800 font-bold">✓ خصم معتمد</td>
              </tr>

              {/* FINAL RESULT: NET VAT PAYABLE */}
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-4 px-4 text-center text-emerald-400 font-mono text-base">7</td>
                <td className="py-4 px-4 text-base">
                  صافي ضريبة القيمة المضافة المستحقة للسداد (بند 3 - بند 6)
                </td>
                <td className="py-4 px-4 font-mono text-slate-400">-</td>
                <td className="py-4 px-4 font-mono text-xl text-emerald-400 font-bold">
                  {netVatPayable.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleCopyValue(netVatPayable.toFixed(2), 'net_vat')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedField === 'net_vat' ? 'تم النسخ!' : 'نسخ المبلغ للسداد'}</span>
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

      {/* Accounting Guidance Note */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold block text-blue-900">
            جاهزية كاملة للرفع على بوابة هيئة الزكاة والضريبة والجمارك (ZATCA Portal Ready)
          </strong>
          <p className="text-blue-800 leading-relaxed">
            جميع الأرقام الواردة في هذا التقرير مستخرجة آلياً من فواتير المبيعات الإلكترونية وسندات الصرف المسجلة في نظامك. يمكنك نسخ كل بند ووضعه مباشرة في خانته المقابلة في بوابة هيئة الزكاة والضريبة والجمارك دون الحاجة لدفع أتعاب إضافية لمكاتب المحاسبة الخارجية.
          </p>
        </div>
      </div>

    </div>
  );
};
