import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterBookings,
  needsAdminApproval,
  owesRefund,
  readApiResponse,
  statusChangeWarnings,
  type AdminBookingRow,
} from './adminBookings';

const base: AdminBookingRow = {
  id: 'b1',
  name: 'عميل',
  phone: '0500000000',
  email: 'a@b.c',
  serviceName: 'قهوة',
  status: 'مؤكد',
  createdAt: '2026-10-01T00:00:00.000Z',
  paymentStatus: 'unpaid',
};

describe('statusChangeWarnings', () => {
  it('needs no confirmation for a routine change', () => {
    assert.deepEqual(statusChangeWarnings({ ...base, paymentStatus: 'paid' }, 'قيد التنفيذ'), []);
    assert.deepEqual(statusChangeWarnings(base, 'مؤكد'), []);
  });

  it('warns when a paid order is cancelled or rejected', () => {
    const paid = { ...base, paymentStatus: 'paid' as const };
    assert.equal(statusChangeWarnings(paid, 'ملغي').length, 1);
    assert.match(statusChangeWarnings(paid, 'مرفوض من المورّد')[0], /استرداد/);
    assert.deepEqual(statusChangeWarnings(base, 'ملغي'), []);
  });

  it('warns on overriding a final status and on going back to new', () => {
    assert.match(statusChangeWarnings({ ...base, status: 'مكتمل' }, 'مؤكد')[0], /نهائية/);
    assert.match(statusChangeWarnings(base, 'جديد')[0], /جديد/);
    assert.equal(statusChangeWarnings({ ...base, status: 'ملغي' }, 'جديد').length, 2);
  });

  it('warns on starting an unpaid order', () => {
    assert.match(statusChangeWarnings(base, 'قيد التنفيذ')[0], /غير مدفوع/);
  });
});

describe('refund and approval state', () => {
  it('counts pending refunds and duplicate payments as owed', () => {
    assert.equal(owesRefund(base), false);
    assert.equal(owesRefund({ ...base, cancellation: { refundStatus: 'pending', refundHalalas: 100 } }), true);
    assert.equal(owesRefund({ ...base, cancellation: { refundStatus: 'refunded' } }), false);
    assert.equal(owesRefund({ ...base, duplicatePayments: [{ paymentId: 'p', amount: 100 }] }), true);
  });

  it('flags multi-vendor approval orders for the admin', () => {
    const pending = { ...base, status: 'بانتظار موافقة المورّد' };
    assert.equal(needsAdminApproval({ ...pending, vendorIds: ['v1'] }), false);
    assert.equal(needsAdminApproval({ ...pending, vendorIds: ['v1', 'v2'] }), true);
    assert.equal(needsAdminApproval({ ...pending, items: [{ vendorId: 'v1' }, { vendorId: 'v2' }] }), true);
  });

  it('filters the table', () => {
    const rows = [
      base,
      { ...base, id: 'b2', status: 'بانتظار موافقة المورّد' },
      { ...base, id: 'b3', cancellation: { refundStatus: 'pending' as const } },
    ];
    assert.equal(filterBookings(rows, 'all').length, 3);
    assert.deepEqual(filterBookings(rows, 'pending_approval').map((r) => r.id), ['b2']);
    assert.deepEqual(filterBookings(rows, 'refund_due').map((r) => r.id), ['b3']);
  });
});

describe('readApiResponse', () => {
  it('never throws on a non-JSON body', async () => {
    const res = new Response('<html>502</html>', { status: 502 });
    const out = await readApiResponse(res, 'fallback');
    assert.equal(out.ok, false);
    assert.equal(out.error, 'fallback');
  });

  it('surfaces the server error on a 409', async () => {
    const res = new Response(JSON.stringify({ success: false, error: 'مدفوع' }), { status: 409 });
    const out = await readApiResponse(res, 'fallback');
    assert.equal(out.ok, false);
    assert.equal(out.error, 'مدفوع');
  });

  it('passes a successful body through', async () => {
    const res = new Response(JSON.stringify({ success: true, data: [1] }), { status: 200 });
    const out = await readApiResponse(res, 'fallback');
    assert.equal(out.ok, true);
    assert.deepEqual(out.data?.data, [1]);
  });
});
