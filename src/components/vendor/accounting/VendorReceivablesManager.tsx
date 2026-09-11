import React, { useState } from 'react';
import { ReceivableDebt, VendorBrandSettings } from '../../../types';
import { generatePaymentReceiptPDF } from '../../../utils/zatcaPdfExporter';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  Receipt,
  UserCheck,
  Send,
  Printer,
  Sparkles,
  PhoneCall,
  Download,
} from 'lucide-react';

interface VendorReceivablesManagerProps {
  receivables: ReceivableDebt[];
  brandSettings: VendorBrandSettings;
  onRecordPayment: (debtId: string, paidAmount: number, paymentMethod: string) => void;
  onSendReminder: (debtId: string, phone: string, message: string) => void;
}

export const VendorReceivablesManager: React.FC<VendorReceivablesManagerProps> = ({
  receivables,
  brandSettings,
  onRecordPayment,
  onSendReminder,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal State
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<ReceivableDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptSuccessModal, setReceiptSuccessModal] = useState<{
    debt: ReceivableDebt;
    amount: number;
    receiptNumber: string;
  } | null>(null);

  // WhatsApp reminder preview modal
  const [reminderModalDebt, setReminderModalDebt] = useState<ReceivableDebt | null>(null);
  const [customReminderText, setCustomReminderText] = useState('');

  // Calculations
  const totalReceivablesAmount = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  const overdueAmount = receivables
    .filter((r) => r.status.startsWith('overdue'))
    .reduce((sum, r) => sum + r.remainingAmount, 0);
  const dueSoonAmount = receivables
    .filter((r) => r.status === 'due_soon' || r.status === 'current')
    .reduce((sum, r) => sum + r.remainingAmount, 0);
  const criticalOverdueCount = receivables.filter((r) => r.status === 'overdue_30_plus').length;

  // Filtered List
  const filteredList = receivables.filter((item) => {
    if (filterStatus === 'overdue' && !item.status.startsWith('overdue')) return false;
    if (filterStatus === 'due_soon' && item.status !== 'due_soon' && item.status !== 'current') return false;
    if (filterStatus === 'critical' && item.status !== 'overdue_30_plus') return false;
    if (filterStatus === 'collected' && item.status !== 'collected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName.toLowerCase().includes(q);
      const matchPhone = item.customerPhone.includes(q);
      const matchInv = item.invoiceNumber.toLowerCase().includes(q);
      const matchService = item.serviceTitle.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchInv && !matchService) return false;
    }
    return true;
  });

  const handleOpenPayment = (debt: ReceivableDebt) => {
    setSelectedDebtForPayment(debt);
    setPaymentAmount(debt.remainingAmount);
  };

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment || paymentAmount <= 0) return;

    onRecordPayment(selectedDebtForPayment.id, paymentAmount, paymentMethod);
    const receiptNum = `REC-VOUCHER-${Math.floor(10000 + Math.random() * 90000)}`;
    
    setReceiptSuccessModal({
      debt: selectedDebtForPayment,
      amount: paymentAmount,
      receiptNumber: receiptNum,
    });

    setSelectedDebtForPayment(null);
  };

  const handleOpenReminder = (debt: ReceivableDebt) => {
    const text = `مرحباً بك أستاذ/ة ${debt.customerName} الكريم،\n\nنأمل أن تكون مناسبتكم (${debt.serviceTitle}) كانت بأجمل ما يكون. نود تذكيركم بلطف بالمبلغ المتبقي وقدره (${debt.remainingAmount.toLocaleString('ar-SA')} ر.س) الخاص بالفاتورة رقم ${debt.invoiceNumber}.\n\nبيانات التحويل البنكي:\nمصرف: ${brandSettings.bankName}\nالحساب: ${brandSettings.accountHolder}\nالآيبان: ${brandSettings.iban}\n\nشاكرين ومقدرين حسن تعاونكم،\n${brandSettings.brandName}`;
    setCustomReminderText(text);
    setReminderModalDebt(debt);
  };

  const handleSendWhatsAppSubmit = () => {
    if (!reminderModalDebt) return;
    onSendReminder(reminderModalDebt.id, reminderModalDebt.customerPhone, customReminderText);
    
    // Open real WhatsApp web link
    const cleanPhone = reminderModalDebt.customerPhone.replace(/\D/g, '');
    const saPhone = cleanPhone.startsWith('966') ? cleanPhone : '966' + cleanPhone.replace(/^0/, '');
    window.open(`https://wa.me/${saPhone}?text=${encodeURIComponent(customReminderText)}`, '_blank');

    setReminderModalDebt(null);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>نظام إدارة الذمم المدينة والتحصيل الذكي (Debt Aging & Receivables)</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            متابعة مستحقات العملاء وتحصيل الديون العالقة
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            توفير آلاف الريالات المفقودة من خلال تذكيرات الواتساب الذكية بروابط السداد، وجدولة أعمار الديون وسندات القبض الفورية.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards for Aging Debts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5">
          <span className="text-xs text-slate-500 font-bold">إجمالي المستحقات العالقة في السوق</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {totalReceivablesAmount.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-500">
            موزعة على <span className="font-bold text-slate-800">{receivables.length} عميل</span>
          </div>
        </div>

        {/* Overdue (>0 days) */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-900 font-bold">مستحقات متأخرة تجاوزت تاريخ الاستحقاق</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-950">
            {overdueAmount.toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-amber-800">ر.س</span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold">
            تتطلب إرسال تذكيرات ومتابعة فورية
          </div>
        </div>

        {/* Critical (>30 days) */}
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 card-shadow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-900 font-bold">ديون حرجة (+30 يوماً تأخير)</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
              {criticalOverdueCount} عملاء
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-950">
            {receivables
              .filter((r) => r.status === 'overdue_30_plus')
              .reduce((sum, r) => sum + r.remainingAmount, 0)
              .toLocaleString('ar-SA')}{' '}
            <span className="text-xs font-sans text-rose-800">ر.س</span>
          </div>
          <div className="text-[11px] text-rose-800">
            مخاطر تدفق نقدي عالية - يفضل الاتصال المباشر
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 card-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الذمم ({receivables.length})
          </button>

          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === 'overdue'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            المتأخرة ({receivables.filter((r) => r.status.startsWith('overdue')).length})
          </button>

          <button
            onClick={() => setFilterStatus('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === 'critical'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            حرجة (+30 يوم) ({criticalOverdueCount})
          </button>

          <button
            onClick={() => setFilterStatus('due_soon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === 'due_soon'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            مستحقة قريباً ({receivables.filter((r) => r.status === 'due_soon' || r.status === 'current').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الجوال، أو رقم الفاتورة..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </div>

      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">العميل والمناسبة</th>
                <th className="py-3.5 px-4">رقم الفاتورة</th>
                <th className="py-3.5 px-4">تاريخ الاستحقاق</th>
                <th className="py-3.5 px-4">إجمالي الفاتورة</th>
                <th className="py-3.5 px-4">العربون المسدد</th>
                <th className="py-3.5 px-4 text-rose-700">المبلغ المتبقي</th>
                <th className="py-3.5 px-4">فترة التأخير</th>
                <th className="py-3.5 px-4 text-center">إجراءات التحصيل السريع</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد ذمم مطابقة لخيارات الفلترة
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isCritical = item.status === 'overdue_30_plus';
                  const isOverdue = item.status.startsWith('overdue');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Client Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.customerPhone}</div>
                        <div className="text-[10px] text-blue-600">{item.serviceTitle}</div>
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {item.invoiceNumber}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.dueDate}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {item.totalAmount.toLocaleString('ar-SA')} ر.س
                      </td>

                      {/* Deposit Paid */}
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                        {item.depositPaid.toLocaleString('ar-SA')} ر.س
                      </td>

                      {/* Remaining Amount */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-rose-700 text-sm">
                        {item.remainingAmount.toLocaleString('ar-SA')} ر.س
                      </td>

                      {/* Aging Badge */}
                      <td className="py-3.5 px-4">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            متأخر {item.agingDays} يوم
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                            متأخر {item.agingDays} يوم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                            مستحق في وقته
                          </span>
                        )}
                        {item.remindersCount > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            أُرسل {item.remindersCount} تذكير
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* WhatsApp Reminder Button */}
                          <button
                            onClick={() => handleOpenReminder(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition-colors border border-emerald-200"
                            title="إرسال تذكير واتساب ذكي بالآيبان"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تذكير سداد</span>
                          </button>

                          {/* Record Payment Button */}
                          <button
                            onClick={() => handleOpenPayment(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 transition-transform shadow-xs"
                            title="تسجيل سداد دفعة نقدية أو بنكية"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تحصيل دفعة</span>
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

      {/* PAYMENT MODAL (تسجيل سداد دفعة وتوليد سند قبض) */}
      {selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs usil-modal-scroll">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-5 text-right card-shadow">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  تسجيل سداد دفعة وسند قبض (Receipt Voucher)
                </h4>
                <p className="text-xs text-slate-500">
                  العميل: {selectedDebtForPayment.customerName} • فاتورة: {selectedDebtForPayment.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedDebtForPayment(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentSubmit} className="space-y-4">
              
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">المبلغ المتبقي الأصلي:</span>
                <span className="font-mono font-extrabold text-rose-700 text-sm">
                  {selectedDebtForPayment.remainingAmount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المبلغ المسدد الآن (ر.س) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedDebtForPayment.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:border-blue-500 focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  طريقة الاستلام والتحصيل *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-blue-500 focus:outline-none bg-white text-right"
                >
                  <option value="bank_transfer">تحويل بنكي مباشر (مصرف الراجحي / الأهلي)</option>
                  <option value="mada">شبكة مدى / بطاقة بنكية (POS)</option>
                  <option value="cash">نقداً في الموقع (استلمها المشرف / السائق)</option>
                  <option value="apple_pay">Apple Pay / محفظة إلكترونية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات أو مرجع الحوالة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: رقم الحوالة 88192 أو تسليم كاش للمشرف أبو فهد"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none text-right"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors"
                >
                  تأكيد استلام المبلغ وتوليد سند القبض
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDebtForPayment(null)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER PREVIEW MODAL */}
      {reminderModalDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs usil-modal-scroll">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 text-right card-shadow">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  إرسال تذكير سداد رسمي عبر الواتساب
                </h4>
              </div>
              <button
                onClick={() => setReminderModalDebt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                نص الرسالة المهذبة بهوية ({brandSettings.brandName}):
              </label>
              <textarea
                rows={9}
                value={customReminderText}
                onChange={(e) => setCustomReminderText(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-normal leading-relaxed focus:border-emerald-500 focus:outline-none text-right bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSendWhatsAppSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>إرسال فوري إلى واتساب العميل ({reminderModalDebt.customerPhone})</span>
              </button>
              <button
                onClick={() => setReminderModalDebt(null)}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT VOUCHER SUCCESS MODAL (سند القبض الفوري) */}
      {receiptSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs usil-modal-scroll">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 text-right card-shadow border border-emerald-200">
            
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                تم تسجيل السداد بنجاح!
              </h4>
              <p className="text-xs text-slate-500">
                تم توليد سند قبض رسمي وتحديث الرصيد المتبقي للعميل.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">رقم سند القبض:</span>
                <span className="font-mono font-bold text-slate-900">{receiptSuccessModal.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">استلمنا من السيد/ة:</span>
                <span className="font-bold text-slate-900">{receiptSuccessModal.debt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المبلغ المقبوض:</span>
                <span className="font-mono font-extrabold text-emerald-700 text-sm">
                  {receiptSuccessModal.amount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الرصيد المتبقي على الفاتورة:</span>
                <span className="font-mono font-bold text-rose-700">
                  {Math.max(0, receiptSuccessModal.debt.remainingAmount - receiptSuccessModal.amount).toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  generatePaymentReceiptPDF(
                    {
                      receiptNumber: receiptSuccessModal.receiptNumber,
                      customerName: receiptSuccessModal.debt.customerName,
                      customerPhone: receiptSuccessModal.debt.customerPhone,
                      invoiceNumber: receiptSuccessModal.debt.invoiceNumber,
                      amount: receiptSuccessModal.amount,
                      remainingAmount: Math.max(
                        0,
                        receiptSuccessModal.debt.remainingAmount - receiptSuccessModal.amount
                      ),
                      paymentMethod: paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'cash' ? 'نقداً' : 'مدى / شبكة',
                      date: new Date().toISOString().split('T')[0],
                      notes: paymentNotes || `سداد دفعة عن ${receiptSuccessModal.debt.serviceTitle}`,
                    },
                    brandSettings
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل سند القبض PDF</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1"
                title="طباعة عبر المتصفح"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>طباعة</span>
              </button>
              <button
                onClick={() => setReceiptSuccessModal(null)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
