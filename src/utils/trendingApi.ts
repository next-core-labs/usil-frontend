import type { ServiceItem } from '../types';

/**
 * «ترند هالأسبوع» — the storefront side of `GET /api/catalog/trending` and
 * `POST /api/catalog/listings/:id/view` (backend: server/catalog/).
 */
export type TrendingStats = {
  rank: number;
  score: number;
  bookings: number;
  paidBookings: number;
  views: number;
  isNew: boolean;
  windowDays: number;
};

export type TrendingService = ServiceItem & { trending: TrendingStats };

/** A row on the home shelf: a catalog item, with its stats when the API ranked it. */
export type TrendingShelfItem = ServiceItem & { trending?: TrendingStats };

export const TRENDING_SHELF_SIZE = 8;
/** The podium needs three; below that the section is not drawn. */
export const TRENDING_SHELF_MIN = 3;

export async function fetchTrending(limit = TRENDING_SHELF_SIZE): Promise<TrendingService[]> {
  const res = await fetch(`/api/catalog/trending?limit=${encodeURIComponent(String(limit))}`);
  if (!res.ok) throw new Error(`trending ${res.status}`);
  const body = (await res.json()) as { success?: boolean; data?: unknown };
  if (!body.success || !Array.isArray(body.data)) throw new Error('trending payload');
  return (body.data as TrendingService[]).filter((row) => row && typeof row.id === 'string' && row.trending);
}

/**
 * Build the home shelf from what the API ranked, keeping the catalog's own
 * copy of each item (so favourites and compare match by reference) and
 * dropping anything the catalog no longer lists. When the API is down or the
 * market is too young to fill a podium, the rest of the catalog pads the shelf
 * in catalog order, without stats.
 */
export function trendingShelf(
  trending: TrendingService[],
  services: ServiceItem[],
  size = TRENDING_SHELF_SIZE,
): TrendingShelfItem[] {
  const byId = new Map(services.map((item) => [item.id, item] as const));
  const shelf: TrendingShelfItem[] = [];
  const used = new Set<string>();
  for (const row of [...trending].sort((a, b) => a.trending.rank - b.trending.rank)) {
    const item = byId.get(row.id);
    if (!item || used.has(row.id)) continue;
    used.add(row.id);
    shelf.push({ ...item, trending: row.trending });
    if (shelf.length >= size) return shelf;
  }
  for (const item of services) {
    if (shelf.length >= size) break;
    if (used.has(item.id)) continue;
    used.add(item.id);
    shelf.push(item);
  }
  return shelf;
}

/** Ids in the top `count` ranked rows — the catalog grid badges them. */
export function trendingTopIds(trending: TrendingService[], count = 3): Set<string> {
  return new Set(
    [...trending]
      .filter((row) => row.trending.score > 0)
      .sort((a, b) => a.trending.rank - b.trending.rank)
      .slice(0, count)
      .map((row) => row.id),
  );
}

type KeyValueStorage = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

const VIEWED_PREFIX = 'usil_viewed:';

/**
 * One view per product per browser session: reopening the same page while
 * comparing options is browsing, not a trend. The server dedupes per caller as
 * well, but this saves the request.
 */
export function shouldRecordView(listingId: string, storage: KeyValueStorage | null): boolean {
  const id = String(listingId || '').trim();
  if (!id) return false;
  if (!storage) return true;
  try {
    const key = `${VIEWED_PREFIX}${id}`;
    if (storage.getItem(key)) return false;
    storage.setItem(key, '1');
  } catch {
    /* private mode or blocked storage: count it, the server dedupes anyway */
  }
  return true;
}

function sessionStore(): KeyValueStorage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** Fire-and-forget; the storefront never waits on it or shows an error for it. */
export function recordListingView(listingId: string): void {
  if (!shouldRecordView(listingId, sessionStore())) return;
  try {
    void fetch(`/api/catalog/listings/${encodeURIComponent(listingId)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}
