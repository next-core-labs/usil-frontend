import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { VendorBooking } from '../types.ts';
import { buildClientContacts, CLIENT_TEMPLATES, fillTemplate, SUPPORT_TEMPLATES, templateBody } from './vendorWhatsApp.ts';

function booking(overrides: Partial<VendorBooking>): VendorBooking {
  return {
    id: 'b',
    bookingNumber: 'BK-1',
    serviceId: 's',
    serviceTitle: 'ضيافة قهوة',
    customerName: 'نورة',
    customerPhone: '0512345678',
    date: '2026-10-01',
    startTime: '18:00',
    endTime: '22:00',
    city: 'الرياض',
    venueName: 'قاعة الندى',
    guestCount: 50,
    totalAmount: 1000,
    depositAmount: 300,
    remainingAmount: 700,
    source: 'platform',
    status: 'confirmed',
    createdAt: '2026-09-01',
    ...overrides,
  };
}

describe('buildClientContacts', () => {
  it('merges one client across phone formats and focuses the next upcoming event', () => {
    const contacts = buildClientContacts(
      [
        booking({ id: 'past', date: '2026-08-01', customerPhone: '+966512345678' }),
        booking({ id: 'next', date: '2026-10-05' }),
        booking({ id: 'later', date: '2026-12-01' }),
        booking({ id: 'gone', date: '2026-10-02', status: 'cancelled', totalAmount: 5000 }),
      ],
      '2026-09-26',
    );
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].focus.id, 'next');
    assert.equal(contacts[0].bookings.length, 4);
    // Cancelled bookings do not count toward what the client spent.
    assert.equal(contacts[0].totalSpent, 3000);
  });

  it('lists clients with upcoming events first, then past ones by recency, and skips missing phones', () => {
    const contacts = buildClientContacts(
      [
        booking({ id: 'old', customerName: 'قديم', customerPhone: '0511111111', date: '2026-01-01' }),
        booking({ id: 'recent', customerName: 'حديث', customerPhone: '0522222222', date: '2026-09-01' }),
        booking({ id: 'soon', customerName: 'قريب', customerPhone: '0533333333', date: '2026-09-30' }),
        booking({ id: 'nophone', customerPhone: '' }),
      ],
      '2026-09-26',
    );
    assert.deepEqual(contacts.map((item) => item.name), ['قريب', 'حديث', 'قديم']);
  });
});

describe('fillTemplate', () => {
  it('fills booking details and the brand', () => {
    const text = fillTemplate(templateBody(CLIENT_TEMPLATES, 'confirm'), {
      name: 'نورة',
      brand: 'قهوة سارة',
      booking: booking({}),
    });
    assert.match(text, /نورة/);
    assert.match(text, /قهوة سارة/);
    assert.match(text, /قاعة الندى/);
    assert.match(text, /BK-1/);
    assert.doesNotMatch(text, /\{/);
  });

  it('never leaves braces when there is no booking', () => {
    for (const template of [...CLIENT_TEMPLATES, ...SUPPORT_TEMPLATES]) {
      assert.doesNotMatch(fillTemplate(template.body, {}), /\{\w+\}/, template.id);
    }
  });
});
