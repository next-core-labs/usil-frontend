import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSmartContract,
  phoneToWhatsApp,
  whatsappContractUrl,
  contractPrintHtml,
  defaultContractTerms,
} from './vendorContracts.ts';

describe('vendorContracts', () => {
  it('rejects a contract without client identity', () => {
    assert.throws(
      () => buildSmartContract({ clientName: '', clientPhone: '', eventDate: '2026-09-01', eventLocation: 'الرياض', serviceTitle: 'ضيافة', totalAmount: 1000 }),
      /مطلوبان/,
    );
  });

  it('builds a pending contract with remaining balance and terms', () => {
    const contract = buildSmartContract(
      {
        clientName: 'نواف',
        clientPhone: '0504444444',
        eventDate: '2026-09-20',
        eventLocation: 'قاعة النخيل',
        serviceTitle: 'بوفيه ملكي',
        totalAmount: 9000,
        depositAmount: 3000,
        vendorName: 'إرث الضيافة',
        notes: 'بدون مكسرات',
      },
      new Date('2026-08-30T10:00:00.000Z'),
    );
    assert.equal(contract.status, 'pending_signature');
    assert.equal(contract.remainingAmount, 6000);
    assert.equal(contract.vendorSignature.stampApplied, true);
    assert.ok(contract.terms.some((term) => term.includes('بوفيه ملكي')));
    assert.ok(contract.terms.some((term) => term.includes('بدون مكسرات')));
    assert.equal(defaultContractTerms('أ').length >= 5, true);
  });

  it('normalizes Saudi phones for WhatsApp and builds a share URL', () => {
    assert.equal(phoneToWhatsApp('0501234567'), '966501234567');
    assert.equal(phoneToWhatsApp('501234567'), '966501234567');
    const url = whatsappContractUrl({
      clientPhone: '0544882190',
      contractNumber: 'CNT-2026-892',
      serviceTitle: 'لاونج قهوة',
      eventDate: '2026-09-12',
      totalAmount: 8900,
    });
    assert.match(url, /^https:\/\/wa\.me\/966544882190\?text=/);
    assert.match(url, /CNT-2026-892/);
  });

  it('renders printable Arabic HTML for a contract', () => {
    const html = contractPrintHtml({
      contractNumber: 'CNT-1',
      vendorName: 'إرث',
      vendorCrNumber: '1010',
      clientName: 'سلطان',
      clientPhone: '0555',
      serviceTitle: 'ضيافة',
      eventDate: '2026-09-05',
      eventLocation: 'نيارة',
      totalAmount: 100,
      depositAmount: 20,
      remainingAmount: 80,
      terms: ['بند أول'],
      vendorSignature: { signedByName: 'عبدالعزيز', signedAt: 'الآن' },
    });
    assert.match(html, /عقد تقديم خدمات ضيافة/);
    assert.match(html, /سلطان/);
    assert.match(html, /بند أول/);
    assert.match(html, /dir="rtl"/);
  });
});
