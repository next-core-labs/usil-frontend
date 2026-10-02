import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ServiceItem } from '../types.ts';
import { shouldRecordView, trendingShelf, trendingTopIds, type TrendingService } from './trendingApi.ts';

function service(id: string): ServiceItem {
  return { id, title: id, price: 100, rating: 0, reviewsCount: 0, cities: [], image: '' } as unknown as ServiceItem;
}

function ranked(id: string, rank: number, score = 1): TrendingService {
  return {
    ...service(id),
    title: `api-${id}`,
    trending: { rank, score, bookings: 0, paidBookings: 0, views: 0, isNew: false, windowDays: 7 },
  };
}

describe('trendingShelf', () => {
  it('orders by API rank, keeps the catalog copy of each item and attaches its stats', () => {
    const catalog = [service('a'), service('b'), service('c')];
    const shelf = trendingShelf([ranked('c', 2), ranked('b', 1)], catalog);
    assert.deepEqual(shelf.map((row) => row.id), ['b', 'c', 'a']);
    assert.equal(shelf[0].title, 'b');
    assert.equal(shelf[0].trending?.rank, 1);
    assert.equal(shelf[2].trending, undefined);
  });

  it('drops ranked rows the catalog no longer lists and pads from the catalog', () => {
    const shelf = trendingShelf([ranked('gone', 1), ranked('a', 2)], [service('a'), service('b')]);
    assert.deepEqual(shelf.map((row) => row.id), ['a', 'b']);
  });

  it('is the plain catalog when the API returned nothing', () => {
    const catalog = [service('a'), service('b'), service('c'), service('d')];
    assert.deepEqual(trendingShelf([], catalog, 3).map((row) => row.id), ['a', 'b', 'c']);
  });

  it('never exceeds the shelf size or repeats an id', () => {
    const catalog = Array.from({ length: 12 }, (_, i) => service(`s${i}`));
    const shelf = trendingShelf([ranked('s3', 1), ranked('s3', 2), ranked('s5', 3)], catalog, 8);
    assert.equal(shelf.length, 8);
    assert.equal(new Set(shelf.map((row) => row.id)).size, 8);
    assert.deepEqual(shelf.slice(0, 2).map((row) => row.id), ['s3', 's5']);
  });
});

describe('trendingTopIds', () => {
  it('badges only rows that actually moved', () => {
    const top = trendingTopIds([ranked('a', 1, 5), ranked('b', 2, 0.25), ranked('c', 3, 0), ranked('d', 4, 0)], 3);
    assert.deepEqual([...top], ['a', 'b']);
  });
});

describe('shouldRecordView', () => {
  function memoryStorage() {
    const map = new Map<string, string>();
    return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
  }

  it('records a product once per session', () => {
    const storage = memoryStorage();
    assert.equal(shouldRecordView('a', storage), true);
    assert.equal(shouldRecordView('a', storage), false);
    assert.equal(shouldRecordView('b', storage), true);
  });

  it('still records when storage is missing or throws, and never for an empty id', () => {
    assert.equal(shouldRecordView('a', null), true);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };
    assert.equal(shouldRecordView('a', broken), true);
    assert.equal(shouldRecordView('  ', memoryStorage()), false);
  });
});
