import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVendorContacts,
  fillVendorTemplate,
  supportReplyText,
  usilWhatsAppUrl,
  VENDOR_TEMPLATES,
  whatsappChatUrl,
} from './ownerWhatsApp.ts';

describe('whatsappChatUrl', () => {
  it('normalizes Saudi numbers and encodes the prefilled text', () => {
    assert.equal(whatsappChatUrl('0512345678'), 'https://wa.me/966512345678');
    assert.equal(whatsappChatUrl('+966 51 234 5678', 'مرحبا'), `https://wa.me/966512345678?text=${encodeURIComponent('مرحبا')}`);
  });

  it('points Usil contact links at the official number', () => {
    assert.equal(usilWhatsAppUrl(), 'https://wa.me/966595001957');
    assert.ok(usilWhatsAppUrl('مرحبا').startsWith('https://wa.me/966595001957?text='));
  });

  it('returns empty for a missing or too-short number', () => {
    assert.equal(whatsappChatUrl(''), '');
    assert.equal(whatsappChatUrl('12345'), '');
  });
});

describe('buildVendorContacts', () => {
  const users = [
    { id: 'u1', name: 'سارة', email: 'Sara@usil.sa', phone: '0500000001', role: 'vendor' },
    { id: 'u2', name: 'عميل', email: 'c@usil.sa', phone: '0500000009', role: 'client' },
  ];
  const applications = [
    { id: 'a1', firstName: 'سارة', familyName: 'العتيبي', projectName: 'قهوة سارة', email: 'sara@usil.sa', phone: '0500000002', status: 'approved' as const },
    { id: 'a2', firstName: 'فهد', familyName: 'القحطاني', projectName: 'ضيافة فهد', email: 'fahad@usil.sa', phone: '0500000003', status: 'pending' as const },
  ];

  it('keeps only vendors and joins accounts to applications by email', () => {
    const contacts = buildVendorContacts({ users, applications, socials: [] });
    assert.equal(contacts.length, 2);
    const sara = contacts.find((item) => item.userId === 'u1');
    assert.equal(sara?.projectName, 'قهوة سارة');
    assert.equal(sara?.applicationStatus, 'approved');
    // The account phone wins over the application phone.
    assert.equal(sara?.phone, '0500000001');
    assert.equal(sara?.phoneSource, 'account');
    const fahad = contacts.find((item) => item.projectName === 'ضيافة فهد');
    assert.equal(fahad?.userId, undefined);
    assert.equal(fahad?.phoneSource, 'application');
  });

  it('prefers the linked business WhatsApp number', () => {
    const contacts = buildVendorContacts({
      users,
      applications,
      socials: [{ vendorId: 'u1', socials: { links: [{ network: 'whatsapp', handle: '0555555555' }] } }],
    });
    const sara = contacts.find((item) => item.userId === 'u1');
    assert.equal(sara?.phone, '0555555555');
    assert.equal(sara?.phoneSource, 'business_whatsapp');
  });
});

describe('templates', () => {
  it('fills the vendor and project names', () => {
    const greeting = VENDOR_TEMPLATES.find((item) => item.id === 'greeting')!;
    const text = fillVendorTemplate(greeting.body, { name: 'سارة', projectName: 'قهوة سارة' });
    assert.match(text, /سارة/);
    assert.match(text, /قهوة سارة/);
    assert.doesNotMatch(text, /\{/);
  });

  it('quotes a shortened support message in the reply', () => {
    const reply = supportReplyText('نواف', 'م'.repeat(300));
    assert.match(reply, /نواف/);
    assert.ok(reply.includes('…'));
  });
});
