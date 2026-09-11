import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vendorApiUrl, workspaceHasData } from './vendorWorkspace.ts';

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
});
