import { useEffect, useSyncExternalStore } from 'react';
import { CATEGORY_DEFS } from '../data/services';

/**
 * «التصنيفات» — the storefront side of `GET /api/categories` (backend:
 * server/catalog/), added and removed from the owner console. Every screen
 * shares one fetch; until it answers, the copy cached from the last visit (or
 * the design's categories) is shown.
 */
export type StoreCategory = {
  id: string;
  name: string;
  short: string;
  icon: string;
  /** '' for the design categories, whose English names live in storefront/copy.ts. */
  nameEn: string;
};

export const ALL_CATEGORY = { id: 'all', name: CATEGORY_DEFS[0].name, short: CATEGORY_DEFS[0].short, icon: CATEGORY_DEFS[0].icon };

const DEFAULT_CATEGORIES: StoreCategory[] = CATEGORY_DEFS.filter((def) => def.id !== 'all').map((def) => ({
  id: def.id,
  name: def.name,
  short: def.short,
  icon: def.icon,
  nameEn: '',
}));

const CACHE_KEY = 'usil.siteCategories';
/** Ids the owner console mints, so a shared `?cat=` link works before the list loads. */
export const OWNER_CATEGORY_ID = /^cat-[0-9a-f]{8}$/;

export function normalizeCategories(raw: unknown): StoreCategory[] | null {
  if (!Array.isArray(raw)) return null;
  const rows = raw
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => ({
      id: String(row.id || ''),
      name: String(row.name || '').trim(),
      short: String(row.short || '').trim(),
      icon: String(row.icon || 'Sparkles'),
      nameEn: String(row.nameEn || '').trim(),
    }))
    .filter((row) => row.id && row.id !== 'all' && row.name)
    .map((row) => ({ ...row, short: row.short || row.name.split(' ')[0] }));
  return rows.length ? rows : null;
}

function readCache(): StoreCategory[] | null {
  try {
    return normalizeCategories(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'));
  } catch {
    return null;
  }
}

let current: StoreCategory[] = readCache() || DEFAULT_CATEGORIES;
let requested = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function load() {
  if (requested || typeof fetch === 'undefined') return;
  requested = true;
  fetch('/api/categories')
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { data?: { categories?: unknown } } | null) => {
      const rows = normalizeCategories(body?.data?.categories);
      if (!rows) return;
      current = rows;
      listeners.forEach((listener) => listener());
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
      } catch {
        /* private mode — the next visit just waits for the API */
      }
    })
    .catch(() => {
      requested = false;
    });
}

/** The live categories, without «الكل». */
export function useCategories(): StoreCategory[] {
  useEffect(load, []);
  return useSyncExternalStore(subscribe, () => current, () => current);
}

/** Outside React (URL parsing, English names): the list as last loaded. */
export function currentCategories(): StoreCategory[] {
  return current;
}

export function isKnownCategoryId(id: string): boolean {
  return id === 'all' || OWNER_CATEGORY_ID.test(id) || current.some((row) => row.id === id);
}

export function categoryEnglishName(id: string): string {
  return current.find((row) => row.id === id)?.nameEn || '';
}
