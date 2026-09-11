export type ContractDraftInput = {
  bookingId?: string;
  clientName: string;
  clientPhone: string;
  vendorName?: string;
  vendorCrNumber?: string;
  eventDate: string;
  eventLocation: string;
  serviceTitle: string;
  totalAmount: number;
  depositAmount?: number;
  notes?: string;
};

export type BuiltSmartContract = {
  id: string;
  contractNumber: string;
  bookingId: string;
  clientName: string;
  clientPhone: string;
  vendorName: string;
  vendorCrNumber: string;
  eventDate: string;
  eventLocation: string;
  serviceTitle: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  status: 'draft' | 'pending_signature' | 'signed_active' | 'completed';
  terms: string[];
  vendorSignature: {
    signedByName: string;
    signedAt: string;
    stampApplied: boolean;
  };
  createdAt: string;
};

export const DEFAULT_CONTRACT_TERMS = [
  'يلتزم المورّد بالحضور لموقع المناسبة قبل الموعد بـ 90 دقيقة للتجهيز وفحص أدوات الضيافة.',
  'يلتزم المورّد بالزي السعودي الرسمي الموحد ونظافة أدوات التقديم وفق الاشتراطات الصحية.',
  'يحق للعميل استرداد كامل العربون إذا أُلغي الحجز قبل موعد المناسبة بـ 72 ساعة على الأقل.',
  'يضمن المورّد خلو المواد المقدمة من مسببات حساسية غير معلنة، والالتزام بجودة الخدمة المتفق عليها.',
  'يسدد العميل المتبقي في يوم المناسبة أو حسب ما يُوثّق في هذا العقد، ويُعد التوقيع الإلكتروني ملزماً للطرفين.',
];

export function defaultContractTerms(serviceTitle: string, extraNote?: string): string[] {
  const terms = [...DEFAULT_CONTRACT_TERMS];
  if (serviceTitle) {
    terms.unshift(`نطاق الخدمة المتفق عليه: ${serviceTitle}.`);
  }
  if (extraNote?.trim()) {
    terms.push(`ملاحظة خاصة بالمناسبة: ${extraNote.trim()}`);
  }
  return terms;
}

export function buildSmartContract(input: ContractDraftInput, now = new Date()): BuiltSmartContract {
  const clientName = String(input.clientName || '').trim();
  const clientPhone = String(input.clientPhone || '').trim();
  if (!clientName || !clientPhone) {
    throw new Error('اسم العميل ورقم الجوال مطلوبان لإنشاء العقد');
  }
  const totalAmount = Math.max(0, Number(input.totalAmount || 0));
  const depositAmount = Math.max(0, Number(input.depositAmount || 0));
  const remainingAmount = Math.max(0, totalAmount - depositAmount);
  const stamp = now.toISOString().replace('T', ' ').slice(0, 16);
  return {
    id: `cnt-${now.getTime()}`,
    contractNumber: `CNT-${now.getFullYear()}-${Math.floor(800 + Math.random() * 9000)}`,
    bookingId: input.bookingId || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName,
    clientPhone,
    vendorName: input.vendorName || 'مؤسسة الضيافة عبر يوصل',
    vendorCrNumber: input.vendorCrNumber || '1010894231',
    eventDate: input.eventDate || now.toISOString().slice(0, 10),
    eventLocation: input.eventLocation || 'مقر المناسبة',
    serviceTitle: input.serviceTitle || 'خدمة ضيافة',
    totalAmount,
    depositAmount,
    remainingAmount,
    status: 'pending_signature',
    terms: defaultContractTerms(input.serviceTitle || 'خدمة ضيافة', input.notes),
    vendorSignature: {
      signedByName: input.vendorName || 'المورّد المعتمد',
      signedAt: stamp,
      stampApplied: true,
    },
    createdAt: now.toISOString().slice(0, 10),
  };
}

export function phoneToWhatsApp(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0') && digits.length >= 9) return `966${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `966${digits}`;
  return digits;
}

export function whatsappContractUrl(contract: {
  clientPhone: string;
  contractNumber: string;
  serviceTitle: string;
  eventDate: string;
  totalAmount: number;
}): string {
  const to = phoneToWhatsApp(contract.clientPhone);
  const text = [
    `عقد ضيافة ذكي من يوصل`,
    `رقم العقد: ${contract.contractNumber}`,
    `الخدمة: ${contract.serviceTitle}`,
    `تاريخ المناسبة: ${contract.eventDate}`,
    `القيمة: ${Number(contract.totalAmount || 0).toLocaleString('ar-SA')} ر.س`,
    `للتأكيد والتوقيع تواصل مع المورّد عبر المنصة: https://usil.app/`,
  ].join('\n');
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export function contractPrintHtml(contract: {
  contractNumber: string;
  vendorName: string;
  vendorCrNumber: string;
  clientName: string;
  clientPhone: string;
  serviceTitle: string;
  eventDate: string;
  eventLocation: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  terms: string[];
  vendorSignature?: { signedByName?: string; signedAt?: string };
  clientSignature?: { signedByName?: string; signedAt?: string };
}): string {
  const terms = (contract.terms || []).map((term) => `<li>${escapeHtml(term)}</li>`).join('');
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(contract.contractNumber)} — عقد ضيافة</title>
  <style>
    body { font-family: "IBM Plex Sans Arabic", Almarai, Tahoma, sans-serif; color: #0A1A33; padding: 32px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { color: #475467; font-size: 13px; margin-bottom: 20px; }
    .box { border: 1px solid #d0d5dd; border-radius: 12px; padding: 16px; margin: 16px 0; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <h1>عقد تقديم خدمات ضيافة</h1>
  <div class="meta">يوصل · ${escapeHtml(contract.contractNumber)}</div>
  <div class="box">
    <p><strong>الطرف الأول (المورّد):</strong> ${escapeHtml(contract.vendorName)} — س.ت ${escapeHtml(contract.vendorCrNumber)}</p>
    <p><strong>الطرف الثاني (العميل):</strong> ${escapeHtml(contract.clientName)} — ${escapeHtml(contract.clientPhone)}</p>
    <p><strong>الخدمة:</strong> ${escapeHtml(contract.serviceTitle)}</p>
    <p><strong>المناسبة:</strong> ${escapeHtml(contract.eventDate)} — ${escapeHtml(contract.eventLocation)}</p>
    <p><strong>القيمة:</strong> ${Number(contract.totalAmount || 0).toLocaleString('ar-SA')} ر.س (عربون ${Number(contract.depositAmount || 0).toLocaleString('ar-SA')} / متبقي ${Number(contract.remainingAmount || 0).toLocaleString('ar-SA')})</p>
  </div>
  <h3>البنود</h3>
  <ol>${terms}</ol>
  <div class="box">
    <p><strong>توقيع المورّد:</strong> ${escapeHtml(contract.vendorSignature?.signedByName || '-')} — ${escapeHtml(contract.vendorSignature?.signedAt || '-')}</p>
    <p><strong>توقيع العميل:</strong> ${escapeHtml(contract.clientSignature?.signedByName || 'بانتظار التوقيع')} — ${escapeHtml(contract.clientSignature?.signedAt || '-')}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
