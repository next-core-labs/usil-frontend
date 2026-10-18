import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceTotals } from './invoiceTotals.ts';

describe('invoiceTotals', () => {
  it('takes VAT out of a VAT-inclusive platform price instead of adding it', () => {
    const totals = invoiceTotals([{ description: 'ركن قهوة', quantity: 1, unitPrice: 1250 }]);
    assert.equal(totals.total, 1250);
    assert.equal(totals.subtotal, 1086.96);
    assert.equal(totals.taxAmount, 163.04);
    assert.equal(totals.items[0].unitPrice, 1086.96);
  });

  it('adds VAT when the vendor enters prices before VAT', () => {
    const totals = invoiceTotals([{ description: 'مباشرين', quantity: 4, unitPrice: 450 }], false);
    assert.equal(totals.subtotal, 1800);
    assert.equal(totals.taxAmount, 270);
    assert.equal(totals.total, 2070);
  });
});
