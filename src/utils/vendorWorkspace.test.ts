import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  changedWorkspace,
  officeFromServer,
  platformOrdersAsCalendar,
  snapshotWorkspace,
  vendorApiUrl,
  workspaceHasData,
} from './vendorWorkspace.ts';

describe('vendorWorkspace helpers', () => {
  it('treats empty payloads as having no data', () => {
    assert.equal(workspaceHasData(null), false);
    assert.equal(workspaceHasData({}), false);
    assert.equal(workspaceHasData({ bookings: [], blockedDates: [], inventoryItems: [] }), false);
  });

  it('detects bookings, blocked dates, or inventory', () => {
    assert.equal(workspaceHasData({ bookings: [{ id: '1' }] }), true);
    assert.equal(workspaceHasData({ blockedDates: [{ id: '2' }] }), true);
    assert.equal(workspaceHasData({ inventoryItems: [{ id: '3' }] }), true);
    assert.equal(workspaceHasData({ contracts: [{ id: '4' }] }), true);
    assert.equal(workspaceHasData({ listings: [{ id: '5' }] }), true);
  });

  it('appends vendorId for supervisor API calls', () => {
    assert.equal(vendorApiUrl('/api/vendor/workspace'), '/api/vendor/workspace');
    assert.equal(vendorApiUrl('/api/vendor/workspace', 'usr-other'), '/api/vendor/workspace?vendorId=usr-other');
  });

  it('reads the back-office books, defaulting missing or malformed lists to empty', () => {
    const office = officeFromServer({
      invoices: [{ id: 'inv-1' }],
      expenses: 'not a list',
      brandSettings: { brandName: 'قهوة الديرة' },
    });
    assert.deepEqual(office.invoices, [{ id: 'inv-1' }]);
    assert.deepEqual(office.expenses, []);
    assert.deepEqual(office.crewMembers, []);
    assert.deepEqual(office.brandSettings, { brandName: 'قهوة الديرة' });
  });

  it('treats an absent or non-object office as empty, with no saved brand', () => {
    for (const raw of [undefined, null, [], 'x']) {
      const office = officeFromServer(raw);
      assert.deepEqual(office.trackings, []);
      assert.equal(office.brandSettings, null);
    }
  });

  it('sends only the sections that changed since the last sync', () => {
    const loaded = {
      inventoryItems: [{ id: 'i-1' }],
      listings: [{ id: 'l-1', price: 185 }],
      office: { crewMembers: [{ id: 'c-1' }], brandSettings: { brandName: 'الفنجال' } },
    };
    const synced = snapshotWorkspace(loaded);
    assert.equal(changedWorkspace(loaded, synced), null);

    const edited = { ...loaded, office: { ...loaded.office, brandSettings: { brandName: 'ضيافة الفنجال' } } };
    const changes = changedWorkspace(edited, synced);
    assert.deepEqual(changes?.payload, { office: { brandSettings: { brandName: 'ضيافة الفنجال' } } });
    assert.deepEqual(Object.keys(changes?.snapshot || {}), ['office.brandSettings']);

    const emptied = changedWorkspace({ ...loaded, inventoryItems: [] }, synced);
    assert.deepEqual(emptied?.payload, { inventoryItems: [] });
  });

  it('puts accepted platform orders on the calendar, read-only, and leaves the rest in the inbox', () => {
    const order = (id: string, status: string, paymentStatus = 'unpaid') => ({
      id,
      name: 'سارة',
      eventDate: '2026-11-08',
      items: [{ id: 'lst-corner', title: 'ركن قهوة' }],
      totalAmount: 1250,
      status,
      paymentStatus,
    });
    const rows = platformOrdersAsCalendar([
      order('BK-1', 'مؤكد'),
      order('BK-2', 'مؤكد', 'paid'),
      order('BK-3', 'بانتظار موافقة المورّد'),
      order('BK-4', 'مرفوض من المورّد'),
      order('BK-5', 'ملغي'),
    ]);
    assert.deepEqual(rows.map((row) => row.bookingNumber), ['BK-1', 'BK-2']);
    assert.equal(rows[0].status, 'pending_deposit');
    assert.equal(rows[0].remainingAmount, 1250);
    assert.equal(rows[1].status, 'confirmed');
    assert.equal(rows[1].source, 'platform');
    assert.equal(rows[1].serviceId, 'lst-corner');
    assert.equal(rows[1].readOnly, true);
    assert.deepEqual(platformOrdersAsCalendar(null), []);
  });
});
