import { ALL_CITIES_LABEL, isSaudiPlaceName } from '../data/saudiPlaces';

export const REGION_STORAGE_KEY = 'usil_selected_region';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    getItem: (key) => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function defaultStore(): Store | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function isStoredRegion(value: string): boolean {
  const name = String(value || '').trim();
  if (!name) return false;
  if (name === ALL_CITIES_LABEL) return true;
  return isSaudiPlaceName(name);
}

export function loadSelectedRegion(store: Store | null = defaultStore()): string | null {
  if (!store) return null;
  try {
    const raw = String(store.getItem(REGION_STORAGE_KEY) || '').trim();
    return isStoredRegion(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveSelectedRegion(value: string, store: Store | null = defaultStore()): string | null {
  if (!store) return null;
  const name = String(value || '').trim();
  if (!isStoredRegion(name)) return loadSelectedRegion(store);
  try {
    store.setItem(REGION_STORAGE_KEY, name);
    return name;
  } catch {
    return null;
  }
}

export { memoryStore as createMemoryRegionStore };
