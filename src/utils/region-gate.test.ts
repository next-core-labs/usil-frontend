import { describe, it } from 'node:test';
import { readSource } from '../../test-support/repo-paths.ts';
import assert from 'node:assert/strict';
import { ALL_CITIES_LABEL, FEATURED_MARKET_PLACES, SAUDI_REGIONS, isSaudiPlaceName } from '../data/saudiPlaces.ts';
import {
  REGION_STORAGE_KEY,
  createMemoryRegionStore,
  isStoredRegion,
  loadSelectedRegion,
  saveSelectedRegion,
} from './regionPreference.ts';

describe('region preference', () => {
  it('saves a Saudi place and ignores junk', () => {
    const store = createMemoryRegionStore();
    assert.equal(loadSelectedRegion(store), null);
    assert.equal(saveSelectedRegion('الرياض', store), 'الرياض');
    assert.equal(loadSelectedRegion(store), 'الرياض');
    assert.equal(store.getItem(REGION_STORAGE_KEY), 'الرياض');
    assert.equal(saveSelectedRegion('ليس مكاناً', store), 'الرياض');
    assert.equal(saveSelectedRegion(ALL_CITIES_LABEL, store), ALL_CITIES_LABEL);
    assert.equal(isStoredRegion(ALL_CITIES_LABEL), true);
    assert.equal(isStoredRegion(''), false);
    assert.equal(isSaudiPlaceName('جدة'), true);
  });

  it('keeps Lamat-style featured cities inside the 13 regions', () => {
    assert.equal(FEATURED_MARKET_PLACES.length, 5);
    assert.equal(SAUDI_REGIONS.length, 13);
    for (const place of FEATURED_MARKET_PLACES) {
      assert.equal(isSaudiPlaceName(place.name), true, place.name);
    }
  });
});

describe('region gate and category buttons', () => {
  it('asks for a region before the store and keeps icon buttons', () => {
    const gate = readSource('src/components/RegionGate.tsx');
    assert.match(gate, /وين المناسبة؟/);
    assert.match(gate, /اختر المنطقة أول/);
    assert.match(gate, /أشهر المدن/);
    assert.match(gate, /كل المناطق/);
    assert.match(gate, /required/);
    const rail = readSource('src/components/CategoryIconRail.tsx');
    assert.match(rail, /cat\.short/);
    assert.match(rail, /rounded-full/);
    const nav = readSource('src/components/Navbar.tsx');
    assert.match(nav, /onOpenRegionPicker/);
    assert.match(nav, /CategoryIconRail/);
    const app = readSource('src/App.tsx');
    assert.match(app, /RegionGate/);
    assert.match(app, /hasPickedRegion/);
    const services = readSource('src/data/services.ts');
    assert.match(services, /short: 'ضيافة'/);
  });
});
