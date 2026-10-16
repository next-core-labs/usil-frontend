import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serviceMatchesAudience, serviceMatchesPriceRange } from './saudiMarket.ts';

describe('catalog filters', () => {
  it('shows a listing that names no audience under every audience', () => {
    for (const audience of ['women', 'men', 'family', 'corporate']) {
      assert.equal(serviceMatchesAudience({}, audience), true);
      assert.equal(serviceMatchesAudience({ audiences: [] }, audience), true);
    }
  });

  it('matches the audiences a listing names, with family fitting both sections', () => {
    const corporate = { audiences: ['corporate' as const] };
    assert.equal(serviceMatchesAudience(corporate, 'corporate'), true);
    assert.equal(serviceMatchesAudience(corporate, 'women'), false);
    const family = { audiences: ['family' as const] };
    assert.equal(serviceMatchesAudience(family, 'women'), true);
    assert.equal(serviceMatchesAudience(family, 'men'), true);
    assert.equal(serviceMatchesAudience(family, 'corporate'), false);
    assert.equal(serviceMatchesAudience({ audiences: ['women' as const] }, 'all'), true);
  });

  it('puts a boundary price in exactly one band', () => {
    const bands = ['lt1000', '1k3k', '3k8k', 'gt8000'];
    for (const price of [999, 1000, 3000, 3001, 8000, 8001]) {
      assert.equal(bands.filter((b) => serviceMatchesPriceRange(price, b)).length, 1, `price ${price}`);
    }
  });
});
