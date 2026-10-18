import React, { useState } from 'react';
import { VendorInvoice, VendorBrandSettings } from '../../types';
import {
  generateZatcaInvoicePDF,
  generatePaymentReceiptPDF,
} from '../../utils/zatcaPdfExporter';
import { riyadhToday } from '../../utils/riyadhDate';
import { invoiceTotals } from '../../utils/invoiceTotals';

const PDF_ERROR_MSG = 'تعذّر إنشاء ملف PDF. تحقق من الاتصال ثم حاول مرة أخرى.';
function runPdf(task: Promise<void>) {
  task.catch((err) => {
    console.error('PDF export failed', err);
    alert(PDF_ERROR_MSG);
  });
}
import {
  FileText,
  Printer,
  Download,
  Share2,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  DollarSign,
  Sparkles,
  Building2,
  Stamp,
  ExternalLink,
  MessageCircle,
  Clock,
  Receipt,
  FileCheck2,
} from 'lucide-react';

interface VendorInvoiceGeneratorProps {
  invoices: VendorInvoice[];
  brandSettings: VendorBrandSettings;
  onAddInvoice: (invoice: VendorInvoice) => void;
  onOpenBrandSettings?: () => void;
  onOpenTracker?: (trackingCode: string) => void;
}

export const VendorInvoiceGenerator: React.FC<VendorInvoiceGeneratorProps> = ({
  invoices,
  brandSettings,
  onAddInvoice,
  onOpenBrandSettings,
  onOpenTracker,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Derived from the live list so a new/removed invoice is reflected; null when there are none.
  const selectedInvoice: VendorInvoice | null =
    invoices.find((inv) => inv.id === selectedId) ?? invoices[0] ?? null;
  const setSelectedInvoice = (inv: VendorInvoice) => setSelectedId(inv.id);

  // Form State for new invoice
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [eventDate, setEventDate] = useState(() => riyadhToday());
  const [depositPaid, setDepositPaid] = useState(0);
  const [channelSource, setChannelSource] = useState<VendorInvoice['channelSource']>('external_phone');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  // Platform prices are final and VAT-inclusive, so that is the default here too.
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Computations
  const totals = invoiceTotals(items, pricesIncludeVat);
  const { subtotal, taxRate, taxAmount } = totals;
  const grandTotal = totals.total;
  const remaining = Math.max(0, grandTotal - depositPaid);

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    const isPlatform = channelSource === 'mithyaf';
    const feeRate = isPlatform ? 0.15 : 0;
    const feeAmount = Math.round(grandTotal * feeRate * 100) / 100;
    const netAmount = Math.round((grandTotal - feeAmount) * 100) / 100;

    const newInv: VendorInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${riyadhToday().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      clientPhone: clientPhone.trim(),
      clientTaxId,
      eventDate,
      issueDate: riyadhToday(),
      dueDate: eventDate,
      items: totals.items,
      subtotal,
      taxRate,
      taxAmount,
      discount: 0,
      total: grandTotal,
      depositPaid: Number(depositPaid),
      remainingBalance: remaining,
      status: depositPaid >= grandTotal ? 'paid' : depositPaid > 0 ? 'partial' : 'unpaid',
      terms: brandSettings.invoiceFooterNotes || 'الأسعار تشمل التجهيز والإشراف الميداني وسحب المعدات بعد انتهاء المناسبة.',
      paymentMethod: isPlatform ? 'حساب الضمان' : 'تحويل بنكي',
      isWhiteLabel: !isPlatform,
      channelSource,
      platformFeeRate: feeRate,
      platformFeeAmount: feeAmount,
      vendorNetAmount: netAmount,
    };

    onAddInvoice(newInv);
    setSelectedInvoice(newInv);
    setShowCreateModal(false);
    // Reset
    setClientName('');
    setClientPhone('');
    setClientTaxId('');
    setDepositPaid(0);
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleDownloadZatcaPdf = () => {
    if (!selectedInvoice) return;
    runPdf(generateZatcaInvoicePDF(selectedInvoice, brandSettings));
  };

  const handleDownloadDepositReceipt = () => {
    if (!selectedInvoice) return;
    runPdf(generatePaymentReceiptPDF(
      {
        receiptNumber: `REC-${selectedInvoice.invoiceNumber.replace('INV-', '')}-01`,
        customerName: selectedInvoice.clientName,
        customerPhone: selectedInvoice.clientPhone,
        invoiceNumber: selectedInvoice.invoiceNumber,
        amount: selectedInvoice.depositPaid || selectedInvoice.total,
        remainingAmount: selectedInvoice.remainingBalance,
        paymentMethod: selectedInvoice.paymentMethod,
        date: selectedInvoice.issueDate,
        notes: `دفعة عربون مؤكدة لمناسبة تاريخ ${selectedInvoice.eventDate}`,
      },
      brandSettings
    ));
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClientDigits = (selectedInvoice?.clientPhone || '').replace(/\D/g, '');

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-action" />
            <span>مولّد الفواتير وعروض الأسعار بهويتك الخاصة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            عروض الأسعار والفواتير الرسمية المعتمدة
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            أصدر فواتير باسم وشعار وسجل منشأتك مع حساب ضريبة القيمة المضافة. يُضاف رمز QR الضريبي إلى ملف PDF عند إدخال رقمك الضريبي في بيانات البراند.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenBrandSettings && (
            <button
              onClick={onOpenBrandSettings}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4 text-action" />
              <span>تعديل بيانات البراند والختم</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء فاتورة / عرض سعر جديد</span>
          </button>
        </div>
      </div>

      {/* Grid: Invoices List on Right, Active Invoice Preview on Left */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Invoices Selection List (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              سجل الفواتير الصادرة ({invoices.length})
            </h3>
            <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              محدث
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[600px]">
            {invoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              const isExt = inv.channelSource !== 'mithyaf';
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-action shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {inv.clientName}
                    </span>
                    <span className="text-2xs font-mono text-slate-500 font-medium">
                      {inv.invoiceNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-action">
                      {inv.total.toLocaleString('ar-SA')} ر.س
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-2xs font-bold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.status === 'partial'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status === 'paid' ? 'مدفوعة بالكامل' : inv.status === 'partial' ? 'مسدد جزئياً' : 'بانتظار السداد'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-2xs pt-1.5 border-t border-slate-200/60">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${isExt ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
                      {isExt ? '🏷️ براندك (0% عمولة)' : '🌐 طلب يوصل (15% عمولة)'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono">{inv.eventDate}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          runPdf(generateZatcaInvoicePDF(inv, brandSettings));
                        }}
                        className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-action transition-colors"
                        title="تحميل PDF"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Printable Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedInvoice && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 card-shadow text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">لا توجد فواتير بعد</h3>
              <p className="text-xs text-slate-500">أنشئ أول فاتورة أو عرض سعر من زر «إنشاء فاتورة / عرض سعر جديد».</p>
            </div>
          )}
          {selectedInvoice && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6 print:border-none print:shadow-none">
              
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-medium text-slate-500">
                    رقم الوثيقة: {selectedInvoice.invoiceNumber}
                  </span>
                  
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedInvoice.channelSource !== 'mithyaf'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {selectedInvoice.channelSource !== 'mithyaf'
                      ? '✓ فاتورة براندك الخاص (عمولة المنصة 0%)'
                      : 'طلب منصة يوصل (عمولة 15% مشمولة بالضمان)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Download ZATCA Tax Invoice PDF Button */}
                  <button
                    onClick={handleDownloadZatcaPdf}
                    className="px-3.5 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
                    title="تحميل الفاتورة بصيغة PDF" aria-label="تحميل الفاتورة بصيغة PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الفاتورة PDF</span>
                  </button>

                  {/* Download Deposit / Payment Receipt Voucher */}
                  {(selectedInvoice.depositPaid > 0 || selectedInvoice.status === 'paid' || selectedInvoice.status === 'partial') && (
                    <button
                      onClick={handleDownloadDepositReceipt}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="تحميل سند قبض الدفعة كملف PDF رسمي" aria-label="تحميل سند قبض الدفعة كملف PDF رسمي"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>سند قبض PDF</span>
                    </button>
                  )}

                  {selectedClientDigits && (
                    <a
                      href={`https://wa.me/${selectedClientDigits}?text=${encodeURIComponent(
                        `مرحباً ${selectedInvoice.clientName}،\nإليك الفاتورة رقم ${selectedInvoice.invoiceNumber} لمناسبة ${selectedInvoice.eventDate} من ${brandSettings.brandName}.\nالمبلغ الإجمالي: ${selectedInvoice.total} ر.س.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                  )}

                  <button
                    onClick={handlePrint}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="طباعة عبر المتصفح" aria-label="طباعة عبر المتصفح"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-700" />
                    <span>طباعة</span>
                  </button>
                </div>
              </div>

              {/* Invoice Printable Header (100% White-Labeled with Vendor Brand) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3.5">
                  <img
                    src={brandSettings.logoUrl}
                    alt={brandSettings.brandName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-white"
                  />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {brandSettings.brandName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {brandSettings.slogan}
                    </p>
                    <p className="text-2xs text-slate-500 font-mono pt-0.5">
                      س.ت: {brandSettings.crNumber} • الرقم الضريبي: {brandSettings.vatNumber}
                    </p>
                    <p className="text-2xs text-slate-500 font-mono">
                      {brandSettings.city} • جوال: {brandSettings.phone}
                    </p>
                  </div>
                </div>

              </div>

              {/* Welcome Header Note */}
              {brandSettings.invoiceHeaderNote && (
                <div className="p-3 bg-blue-50/50 rounded-xl text-xs text-slate-700 italic border border-blue-100">
                  {brandSettings.invoiceHeaderNote}
                </div>
              )}

              {/* Bill To & Event Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block text-2xs">موجّه إلى العميل:</span>
                  <div className="text-slate-900 font-bold text-sm">{selectedInvoice.clientName}</div>
                  <div className="text-slate-600 font-mono">{selectedInvoice.clientPhone}</div>
                  {selectedInvoice.clientTaxId && (
                    <div className="text-slate-500">رقم ضريبي: {selectedInvoice.clientTaxId}</div>
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <span className="text-slate-500 font-medium block text-2xs">بيانات المناسبة والتواريخ:</span>
                  <div className="text-slate-900 font-semibold">تاريخ الفعالية: {selectedInvoice.eventDate}</div>
                  <div className="text-slate-600 font-mono">تاريخ الإصدار: {selectedInvoice.issueDate}</div>
                  <div className="text-slate-600 font-mono">طريقة الدفع: {selectedInvoice.paymentMethod}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">الوصف والتفاصيل</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">سعر الوحدة</th>
                      <th className="p-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{item.description}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-left font-mono font-medium">
                          {item.unitPrice.toLocaleString('ar-SA')} ر.س
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-slate-900">
                          {item.total.toLocaleString('ar-SA')} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Breakdown */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
                
                {/* Bank Details & Terms */}
                <div className="flex-1 space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">بيانات السداد والتحويل البنكي المعتمد:</span>
                    <span className="text-slate-600 block">{brandSettings.bankName} - {brandSettings.accountHolder}</span>
                    <span className="font-mono text-slate-800 font-bold block">{brandSettings.iban}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-700 font-bold block">شروط التوريد والخدمة:</span>
                    <p className="text-slate-500 leading-relaxed font-normal whitespace-pre-line text-2xs">
                      {selectedInvoice.terms || brandSettings.invoiceFooterNotes}
                    </p>
                  </div>

                  {/* Stamp */}
                  {brandSettings.stampUrl && (
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={brandSettings.stampUrl}
                        alt="الختم الرسمي"
                        className="w-16 h-16 object-contain mix-blend-multiply opacity-80"
                      />
                      <span className="text-2xs text-slate-500 font-medium">الختم والتوقيع المعتمد للمنشأة</span>
                    </div>
                  )}
                </div>

                {/* Amount Calculation Box */}
                <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-bold">{selectedInvoice.subtotal.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono font-bold">{selectedInvoice.taxAmount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي الكلي:</span>
                    <span className="font-mono text-action">{selectedInvoice.total.toLocaleString('ar-SA')} ر.س</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-emerald-800 font-medium text-2xs">
                      <span>العربون المدفوع:</span>
                      <span className="font-mono">{selectedInvoice.depositPaid.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between text-rose-800 font-medium text-xs">
                      <span>المتبقي عند التنفيذ:</span>
                      <span className="font-mono">{selectedInvoice.remainingBalance.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>

      {/* Create New Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs usil-modal-scroll">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 space-y-5 dropdown-shadow max-h-[85vh] overflow-y-auto text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">إنشاء فاتورة / عرض سعر رسمي جديد</h3>
                <p className="text-xs text-slate-500">تصدر بالكامل باسم براندك وشعارك وسجلك التجاري</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-medium"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              
              {/* Channel Selector */}
              <div>
                <label className="block text-2xs font-medium text-slate-700 mb-1">مصدر الحجز</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  {[
                    { id: 'external_phone', label: 'حجز اتصال مباشر (0% عمولة)' },
                    { id: 'pos_cashier', label: 'كاشير المحل / المعرض (0% عمولة)' },
                    { id: 'mithyaf', label: 'طلب منصة يوصل (15% عمولة)' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannelSource(ch.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        channelSource === ch.id
                          ? 'bg-navy text-white border-navy'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-medium text-slate-700 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: فهد الدوسري"
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-action"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-700 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-medium text-slate-700 mb-1">تاريخ المناسبة</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-action"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-700 mb-1">العربون المسدد مسبقاً</label>
                  <input
                    type="number"
                    value={depositPaid}
                    onChange={(e) => setDepositPaid(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              {/* Items in modal */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-medium text-slate-700">بنود الخدمة والأسعار</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-2xs text-action font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة بند آخر</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 text-2xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={pricesIncludeVat}
                    onChange={(e) => setPricesIncludeVat(e.target.checked)}
                  />
                  <span>الأسعار المكتوبة شاملة الضريبة (مثل أسعار يوصل)</span>
                </label>

                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="وصف البند"
                      className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      placeholder="الكمية"
                      className="w-16 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-center text-slate-900"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      placeholder="السعر"
                      className="w-24 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-center text-slate-900"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total summary */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-medium text-blue-900">
                <span>الإجمالي شامل الضريبة (15%):</span>
                <span className="text-sm font-mono">{grandTotal.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-action hover:bg-action-hover text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
                >
                  إصدار الفاتورة وحفظها بعلامتك
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium"
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
