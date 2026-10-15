import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

const { clearPendingPayment, isMoyasarUrl, loadPendingPayment, savePendingPayment } = await import('./pendingPayment.ts');

describe('pendingPayment', () => {
  afterEach(() => store.clear());

  it('only accepts Moyasar-hosted payment links', () => {
    assert.equal(isMoyasarUrl('https://checkout.moyasar.com/invoices/abc'), true);
    assert.equal(isMoyasarUrl('https://moyasar.com.evil.example/pay'), false);
    savePendingPayment('BK-1', 'https://evil.example/pay');
    assert.equal(loadPendingPayment(), null);
  });

  it('round-trips a pending payment and clears it', () => {
    savePendingPayment('BK-1', 'https://checkout.moyasar.com/invoices/abc');
    assert.equal(loadPendingPayment()?.bookingId, 'BK-1');
    clearPendingPayment();
    assert.equal(loadPendingPayment(), null);
  });

  it('forgets a pending payment older than a day', () => {
    savePendingPayment('BK-2', 'https://checkout.moyasar.com/invoices/xyz');
    assert.equal(loadPendingPayment(Date.now() + 25 * 60 * 60 * 1000), null);
  });
});
