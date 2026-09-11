import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultFulfillmentForCategory,
  FULFILLMENT_IDS,
  FULFILLMENT_LANES,
} from './saudiMarket.ts';

describe('fulfillment lanes', () => {
  it('keeps honest fulfillment lane ids for vendor listings', () => {
    assert.deepEqual(FULFILLMENT_IDS, ['hour', 'same_day', 'tomorrow', 'instant']);
  });

  it('gives new vendor products honest category defaults', () => {
    assert.deepEqual(defaultFulfillmentForCategory('halls'), ['instant']);
    assert.deepEqual(defaultFulfillmentForCategory('hospitality'), ['hour', 'same_day']);
    assert.deepEqual(defaultFulfillmentForCategory('rental'), ['same_day', 'tomorrow']);
  });

  it('uses honest Arabic chips without 15-minute courier language', () => {
    const chips = FULFILLMENT_LANES.map((lane) => lane.chip);
    assert.deepEqual(chips, ['يوصل ساعة', 'يوصل اليوم', 'يوصل بكرا', 'حجز فوري']);
    const copy = FULFILLMENT_LANES.map((lane) => `${lane.meaning} ${lane.examples}`).join(' ');
    assert.equal(copy.includes('15'), false);
    assert.equal(copy.includes('دقيقة'), false);
  });
});
