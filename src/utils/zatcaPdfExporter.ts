import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VendorInvoice, VendorBrandSettings, ConsolidatedCrewPaymentVoucher } from '../types';
import { tafqeetSAR } from './arabicNumberToWords';
import { applyArabicFont, PDF_FONT } from './pdfArabicFont';
import { encodeQrMatrix } from './qrMatrix';

/** A Saudi VAT registration number: 15 digits, starting and ending with 3. */
export function isValidSaudiVatNumber(vat: string | undefined | null): boolean {
  return !!vat && /^3\d{13}3$/.test(vat.replace(/\s/g, ''));
}

/** ISO-8601 timestamp (seconds precision, UTC) for a `YYYY-MM-DD` issue date in Riyadh. */
function zatcaTimestamp(issueDate: string | undefined): string {
  const d = issueDate && /^\d{4}-\d{2}-\d{2}$/.test(issueDate)
    ? new Date(`${issueDate}T00:00:00+03:00`)
    : new Date();
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function newA4(): jsPDF {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
}

/**
 * Encodes ZATCA TLV (Tag-Length-Value) string for QR Code compliance
 * Tag 1: Seller's Name
 * Tag 2: VAT Registration Number (15 digits)
 * Tag 3: Time Stamp (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Total
 */
export function generateZatcaTlvBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: number,
  vatAmount: number
): string {
  const getTlv = (tagNum: number, tagValue: string): Uint8Array => {
    const encoder = new TextEncoder();
    const valBytes = encoder.encode(tagValue);
    const length = valBytes.length;
    const tlv = new Uint8Array(2 + length);
    tlv[0] = tagNum;
    tlv[1] = length;
    tlv.set(valBytes, 2);
    return tlv;
  };

  const tag1 = getTlv(1, sellerName);
  const tag2 = getTlv(2, vatNumber);
  const tag3 = getTlv(3, timestamp || new Date().toISOString());
  const tag4 = getTlv(4, totalAmount.toFixed(2));
  const tag5 = getTlv(5, vatAmount.toFixed(2));

  const totalLength = tag1.length + tag2.length + tag3.length + tag4.length + tag5.length;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  [tag1, tag2, tag3, tag4, tag5].forEach((tag) => {
    combined.set(tag, offset);
    offset += tag.length;
  });

  // Convert Uint8Array to base64
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Draws a real, scannable QR code of `qrText` (module grid from the ZXing encoder).
 */
async function drawQrCode(doc: jsPDF, x: number, y: number, size: number, qrText: string, caption: string) {
  const matrix = await encodeQrMatrix(qrText);
  const quiet = 2; // modules of white border on each side
  const count = matrix.length + quiet * 2;
  const cell = size / count;

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.setFillColor(0, 0, 0);
  matrix.forEach((row, r) => {
    row.forEach((dark, c) => {
      // Slight overlap avoids hairline gaps between modules in some viewers.
      if (dark) doc.rect(x + (c + quiet) * cell, y + (r + quiet) * cell, cell + 0.02, cell + 0.02, 'F');
    });
  });

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(caption, x + size / 2, y + size + 3.5, { align: 'center' });
}

/**
 * Generates and downloads an invoice PDF. When the vendor has a valid Saudi VAT
 * number it is a simplified tax invoice carrying a real ZATCA (phase 1) TLV QR
 * code; otherwise it is a plain invoice with no QR and no tax-invoice claim.
 */
export async function generateZatcaInvoicePDF(
  invoice: VendorInvoice,
  brandSettings: VendorBrandSettings
): Promise<void> {
  const doc = newA4();
  await applyArabicFont(doc);
  const hasVat = isValidSaudiVatNumber(brandSettings.vatNumber);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Background bar
  doc.setFillColor(10, 26, 51); // Dark Navy #0A1A33
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent line
  doc.setFillColor(192, 161, 107); // Gold #C0A16B
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(hasVat ? 'SIMPLIFIED TAX INVOICE | فاتورة ضريبية مبسطة' : 'INVOICE | فاتورة', margin, 12);
  doc.setFontSize(9);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(192, 161, 107);
  doc.text(
    hasVat ? `VAT ${Math.round((invoice.taxRate || 0.15) * 100)}% | ضريبة القيمة المضافة` : 'المملكة العربية السعودية',
    margin,
    18
  );

  // Status Badge in Header
  const statusText = invoice.status === 'paid' ? 'مدفوعة | PAID' : invoice.status === 'partial' ? 'مدفوعة جزئياً | PARTIAL' : 'غير مدفوعة | UNPAID';
  doc.setFillColor(invoice.status === 'paid' ? 16 : 245, invoice.status === 'paid' ? 185 : 158, invoice.status === 'paid' ? 129 : 11);
  doc.roundedRect(pageWidth - margin - 38, 7, 38, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(statusText, pageWidth - margin - 19, 14.5, { align: 'center' });

  // Seller Details (Left) & QR Code (Right)
  let curY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(brandSettings.brandName || '—', margin, curY);

  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(71, 85, 105);
  curY += 5;
  if (brandSettings.slogan) {
    doc.text(brandSettings.slogan, margin, curY);
    curY += 4.5;
  }
  if (brandSettings.vatNumber) {
    doc.text(`VAT No.: ${brandSettings.vatNumber} | الرقم الضريبي`, margin, curY);
    curY += 4.5;
  }
  const crLine = [
    brandSettings.crNumber ? `CR: ${brandSettings.crNumber} | السجل التجاري` : '',
    brandSettings.city ? `City: ${brandSettings.city}` : '',
  ].filter(Boolean).join(' | ');
  if (crLine) {
    doc.text(crLine, margin, curY);
    curY += 4.5;
  }
  const contactLine = [
    brandSettings.phone ? `Contact: ${brandSettings.phone}` : '',
    brandSettings.email ? `Email: ${brandSettings.email}` : '',
  ].filter(Boolean).join(' | ');
  if (contactLine) doc.text(contactLine, margin, curY);

  // Real ZATCA phase-1 QR (TLV: seller, VAT no., timestamp, total, VAT) — only with a valid VAT number.
  if (hasVat) {
    const qrSize = 25;
    const tlv = generateZatcaTlvBase64(
      brandSettings.brandName || brandSettings.accountHolder || 'Vendor',
      brandSettings.vatNumber.replace(/\s/g, ''),
      zatcaTimestamp(invoice.issueDate),
      invoice.total,
      invoice.taxAmount
    );
    await drawQrCode(doc, pageWidth - margin - qrSize, 33, qrSize, tlv, 'رمز QR للفاتورة الضريبية');
  }

  // Metadata Box (Invoice Details & Customer Details)
  curY = 64;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, pageWidth - margin * 2, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, pageWidth - margin * 2, 28, 2, 2, 'S');

  // Left column: Invoice metadata
  const col1X = margin + 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('INVOICE NO:', col1X, curY + 6);
  doc.text('ISSUE DATE:', col1X, curY + 12);
  doc.text('EVENT DATE:', col1X, curY + 18);
  doc.text('PAYMENT METHOD:', col1X, curY + 24);

  doc.setTextColor(15, 23, 42);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(invoice.invoiceNumber, col1X + 32, curY + 6);
  doc.text(invoice.issueDate, col1X + 32, curY + 12);
  doc.text(invoice.eventDate || invoice.dueDate, col1X + 32, curY + 18);
  doc.text(invoice.paymentMethod || '—', col1X + 32, curY + 24);

  // Right column: Buyer info
  const col2X = pageWidth / 2 + 5;
  doc.setTextColor(100, 116, 139);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('BILLED TO (العميل):', col2X, curY + 6);
  doc.text('CUSTOMER PHONE:', col2X, curY + 12);
  doc.text('CUSTOMER VAT ID:', col2X, curY + 18);
  if (invoice.trackingCode) doc.text('TRACKING CODE:', col2X, curY + 24);

  doc.setTextColor(15, 23, 42);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(invoice.clientName || '—', col2X + 36, curY + 6);
  doc.text(invoice.clientPhone || '—', col2X + 36, curY + 12);
  doc.text(invoice.clientTaxId || '—', col2X + 36, curY + 18);
  if (invoice.trackingCode) {
    doc.setTextColor(21, 94, 239);
    doc.text(invoice.trackingCode, col2X + 36, curY + 24);
  }

  // Table of Items using jspdf-autotable
  const tableData = invoice.items.map((item, index) => {
    const unitPrice = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 1;
    const itemSubtotal = unitPrice * qty;
    const itemVat = itemSubtotal * (invoice.taxRate ?? 0.15);
    const itemTotal = itemSubtotal + itemVat;

    return [
      (index + 1).toString(),
      item.description,
      qty.toString(),
      `${unitPrice.toFixed(2)} SAR`,
      `${itemSubtotal.toFixed(2)} SAR`,
      `${itemVat.toFixed(2)} SAR`,
      `${itemTotal.toFixed(2)} SAR`,
    ];
  });

  autoTable(doc, {
    startY: 97,
    head: [['#', 'Item & Description / الوصف', 'Qty', 'Unit Price', 'Subtotal (Excl)', `VAT (${Math.round((invoice.taxRate ?? 0.15) * 100)}%)`, 'Total (SAR)']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [10, 26, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'right', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [10, 26, 51] },
    },
    styles: {
      font: PDF_FONT,
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Calculate table end position
  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  // Financial Summary Breakdown Box
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;
  const summaryBoxY = finalY + 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, 42, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, 42, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal (قبل الضريبة):', summaryBoxX + 4, summaryBoxY + 7);
  doc.text(`VAT ${Math.round((invoice.taxRate ?? 0.15) * 100)}% (ضريبة القيمة المضافة):`, summaryBoxX + 4, summaryBoxY + 14);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total (الإجمالي شامل الضريبة):', summaryBoxX + 4, summaryBoxY + 22);

  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.subtotal.toFixed(2)} SAR`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 7, { align: 'right' });
  doc.text(`${invoice.taxAmount.toFixed(2)} SAR`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 14, { align: 'right' });
  
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(21, 94, 239);
  doc.setFontSize(9.5);
  doc.text(`${invoice.total.toFixed(2)} SAR`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 22, { align: 'right' });

  // Deposit and Remaining
  doc.setFontSize(8);
  doc.setDrawColor(226, 232, 240);
  doc.line(summaryBoxX + 4, summaryBoxY + 26, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 26);
  
  doc.setTextColor(16, 185, 129);
  doc.text('Deposit Paid (العربون المسدد):', summaryBoxX + 4, summaryBoxY + 32);
  doc.text(`${(invoice.depositPaid || 0).toFixed(2)} SAR`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 32, { align: 'right' });

  doc.setTextColor(225, 29, 72);
  doc.text('Remaining Due (المتبقي):', summaryBoxX + 4, summaryBoxY + 38);
  doc.text(`${(invoice.remainingBalance || 0).toFixed(2)} SAR`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 38, { align: 'right' });

  // Bank Info & Terms (Left side of summary)
  const leftBoxWidth = summaryBoxX - margin - 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, summaryBoxY, leftBoxWidth, 42, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, summaryBoxY, leftBoxWidth, 42, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(10, 26, 51);
  doc.text('Bank Details (الحساب البنكي):', margin + 4, summaryBoxY + 6);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(71, 85, 105);
  const bankLine = [
    brandSettings.bankName ? `Bank: ${brandSettings.bankName}` : '',
    brandSettings.accountHolder || brandSettings.brandName
      ? `Beneficiary: ${brandSettings.accountHolder || brandSettings.brandName}`
      : '',
  ].filter(Boolean).join(' | ');
  doc.text(bankLine || '—', margin + 4, summaryBoxY + 12);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(brandSettings.iban ? `IBAN: ${brandSettings.iban}` : 'IBAN: —', margin + 4, summaryBoxY + 18);

  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(10, 26, 51);
  doc.text('Terms & Conditions (شروط التوريد):', margin + 4, summaryBoxY + 26);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  const termsText = doc.splitTextToSize(
    invoice.terms || brandSettings.invoiceFooterNotes || '',
    leftBoxWidth - 8
  );
  doc.text(termsText, margin + 4, summaryBoxY + 31);

  // Footer & Authorized Seal Note
  const footerY = pageHeight - 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Usil.', margin, footerY + 5);
  doc.text(`Invoice ID: ${invoice.id} | Page 1 of 1`, pageWidth - margin, footerY + 5, { align: 'right' });

  // Save the PDF
  doc.save(`${hasVat ? 'Tax-Invoice' : 'Invoice'}-${invoice.invoiceNumber}.pdf`);
}

/**
 * Generates and downloads an Official Payment Receipt PDF (سند قبض رسمي معتمد)
 */
export async function generatePaymentReceiptPDF(
  receiptData: {
    receiptNumber: string;
    customerName: string;
    customerPhone?: string;
    invoiceNumber: string;
    amount: number;
    remainingAmount: number;
    paymentMethod: string;
    date: string;
    notes?: string;
  },
  brandSettings: VendorBrandSettings
): Promise<void> {
  const doc = newA4();
  await applyArabicFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  // Header Banner
  doc.setFillColor(10, 26, 51);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(192, 161, 107);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('OFFICIAL PAYMENT RECEIPT | سند قبض مالي رسمي', margin, 13);
  doc.setFontSize(8.5);
  doc.setTextColor(192, 161, 107);
  doc.setFont(PDF_FONT, 'normal');
  doc.text('PAYMENT RECEIPT VOUCHER', margin, 20);

  // Receipt Number & Date on right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`Receipt No: ${receiptData.receiptNumber}`, pageWidth - margin, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${receiptData.date}`, pageWidth - margin, 20, { align: 'right' });

  // Vendor Information Header
  let curY = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(brandSettings.brandName || '—', margin, curY);

  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(71, 85, 105);
  curY += 5;
  const idLine = [
    brandSettings.crNumber ? `CR: ${brandSettings.crNumber}` : '',
    brandSettings.vatNumber ? `VAT Number: ${brandSettings.vatNumber}` : '',
  ].filter(Boolean).join(' | ');
  if (idLine) doc.text(idLine, margin, curY);
  curY += 5;
  const cityLine = [
    brandSettings.city ? `City: ${brandSettings.city}` : '',
    brandSettings.phone ? `Phone: ${brandSettings.phone}` : '',
  ].filter(Boolean).join(' | ');
  if (cityLine) doc.text(cityLine, margin, curY);

  // Main Voucher Box
  curY = 56;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, pageWidth - margin * 2, 110, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, pageWidth - margin * 2, 110, 3, 3, 'S');

  // Amount Highlight Banner inside box
  doc.setFillColor(16, 185, 129); // Emerald #10B981
  doc.roundedRect(margin + 6, curY + 6, pageWidth - margin * 2 - 12, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('AMOUNT RECEIVED (المبلغ المقبوض):', margin + 12, curY + 16);
  doc.setFontSize(14);
  doc.text(`${receiptData.amount.toFixed(2)} SAR`, pageWidth - margin - 12, curY + 17, { align: 'right' });

  // Tafqeet in Arabic/English
  const tafqeetText = tafqeetSAR(receiptData.amount);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Amount in Words (المبلغ كتابة):', margin + 8, curY + 30);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(tafqeetText || `${receiptData.amount} Saudi Riyals Only`, margin + 55, curY + 30);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 8, curY + 35, pageWidth - margin - 8, curY + 35);

  // Detailed Lines
  const rows = [
    { label: 'Received From (استلمنا من السيد/ة):', value: receiptData.customerName },
    { label: 'Customer Phone (رقم الجوال):', value: receiptData.customerPhone || '—' },
    { label: 'For Invoice No (وفاءً للفاتورة رقم):', value: receiptData.invoiceNumber },
    { label: 'Payment Method (طريقة الدفع):', value: receiptData.paymentMethod },
    { label: 'Remaining Balance (الرصيد المتبقي):', value: `${receiptData.remainingAmount.toFixed(2)} SAR` },
    { label: 'Notes & Purpose (البيان والملاحظات):', value: receiptData.notes || 'سداد دفعة / عربون حجز مناسبة' },
  ];

  let lineY = curY + 44;
  rows.forEach((r) => {
    doc.setFontSize(8.5);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(r.label, margin + 8, lineY);

    doc.setFont(PDF_FONT, 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r.value, margin + 70, lineY);
    lineY += 9;
  });

  // Signatures Section
  const sigY = curY + 122;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, sigY, (pageWidth - margin * 2 - 8) / 2, 45, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, sigY, (pageWidth - margin * 2 - 8) / 2, 45, 2, 2, 'S');

  doc.roundedRect(pageWidth / 2 + 4, sigY, (pageWidth - margin * 2 - 8) / 2, 45, 2, 2, 'F');
  doc.roundedRect(pageWidth / 2 + 4, sigY, (pageWidth - margin * 2 - 8) / 2, 45, 2, 2, 'S');

  // Recipient signature
  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(10, 26, 51);
  doc.text('Accountant / Cashier (أمين الصندوق والمحاسب):', margin + 6, sigY + 8);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Signature & Stamp: _______________________', margin + 6, sigY + 36);

  // Client signature
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(10, 26, 51);
  doc.text('Depositor / Customer (المسلّم والمودع):', pageWidth / 2 + 10, sigY + 8);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Signature: _______________________', pageWidth / 2 + 10, sigY + 36);

  // Footer
  const footerY = pageHeight - 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Usil.', margin, footerY + 5);
  doc.text(`Receipt ID: ${receiptData.receiptNumber} | Page 1 of 1`, pageWidth - margin, footerY + 5, { align: 'right' });

  doc.save(`Receipt-${receiptData.receiptNumber}.pdf`);
}

/**
 * Generates and downloads a Consolidated Crew Payroll Voucher PDF (سند صرف أجور طاقم موحد)
 */
export async function generateCrewPayrollVoucherPDF(
  voucher: ConsolidatedCrewPaymentVoucher,
  brandSettings: VendorBrandSettings
): Promise<void> {
  const doc = newA4();
  await applyArabicFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(10, 26, 51);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(192, 161, 107);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('CREW CONSOLIDATED PAYROLL VOUCHER', margin, 12);
  doc.setFontSize(8.5);
  doc.setTextColor(192, 161, 107);
  doc.setFont(PDF_FONT, 'normal');
  doc.text('سند صرف أجور الطاقم الميداني الموحد المعتمد', margin, 18);

  // Voucher details top-right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`Voucher: ${voucher.voucherNumber}`, pageWidth - margin, 12, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${voucher.issueDate}`, pageWidth - margin, 18, { align: 'right' });

  // Vendor Info
  let curY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(brandSettings.brandName || '—', margin, curY);

  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'normal');
  doc.setTextColor(71, 85, 105);
  curY += 4.5;
  doc.text(`Payment Method: ${voucher.paymentMethod} | Reference: ${voucher.bankReferenceNumber || '—'}`, margin, curY);
  curY += 4.5;
  doc.text(`Prepared by: ${voucher.preparedBy || '—'} | Approved by: ${voucher.approvedBy || '—'}`, margin, curY);

  // Table of Crew Members & Hours
  const tableData = voucher.entriesSummary.map((item, index) => {
    return [
      (index + 1).toString(),
      item.crewName,
      item.role,
      item.eventTitle,
      `${item.regularHours + (item.overtimeHours || 0)} hrs`,
      `${item.grossAmount.toFixed(2)} SAR`,
      `${(item.bonusAmount || 0).toFixed(2)} SAR`,
      `${(item.deductionAmount || 0).toFixed(2)} SAR`,
      `${item.netPayout.toFixed(2)} SAR`,
    ];
  });

  autoTable(doc, {
    startY: 55,
    head: [['#', 'Crew Member', 'Role', 'Event', 'Hours', 'Gross', 'Bonus', 'Deduction', 'Net Payout']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [10, 26, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    styles: {
      font: PDF_FONT,
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'right', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 'auto' },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 22, fontStyle: 'bold', textColor: [16, 185, 129] },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 80, finalY + 6, 80, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - margin - 80, finalY + 6, 80, 28, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Crew Count (العدد):', pageWidth - margin - 76, finalY + 13);
  doc.text(`${voucher.totalCrewCount} Members`, pageWidth - margin - 4, finalY + 13, { align: 'right' });

  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Net Paid (إجمالي المنصرف):', pageWidth - margin - 76, finalY + 24);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.text(`${(voucher.totalConsolidatedAmount || 0).toFixed(2)} SAR`, pageWidth - margin - 4, finalY + 24, { align: 'right' });

  doc.save(`Crew-Payroll-Voucher-${voucher.voucherNumber}.pdf`);
}
