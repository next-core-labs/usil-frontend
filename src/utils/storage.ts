import localforage from 'localforage';
import { BookingItem, VendorBooking, ClientOrderTracking, UserProfile, InventoryItem } from '../types';

// Configure localforage instance for Usil Platform
export const usilStorage = localforage.createInstance({
  name: 'usil_platform_db',
  storeName: 'usil_data_store',
  description: 'قاعدة بيانات يوصل للتخزين المحلي التلقائي للسلة والحجوزات والمخزون',
});

// Storage Keys Constants
export const STORAGE_KEYS = {
  CART: 'usil_cart_items',
  VENDOR_BOOKINGS: 'usil_vendor_bookings',
  ORDER_TRACKINGS: 'usil_order_trackings',
  DRAFT_BOOKING_FORM: 'usil_draft_booking_form',
  USER_PROFILE: 'usil_user_profile',
  INVENTORY: 'usil_inventory_items',
} as const;

// Fallback helper for localStorage in case of extreme iframe sandbox constraints
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/**
 * Save Cart Items
 */
export async function saveCartToStorage(items: BookingItem[]): Promise<void> {
  try {
    await usilStorage.setItem(STORAGE_KEYS.CART, items);
    safeLocalStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save cart to localforage, fallback to localStorage:', err);
    safeLocalStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
  }
}

/**
 * Load Cart Items
 */
export async function loadCartFromStorage(): Promise<BookingItem[] | null> {
  try {
    const items = await usilStorage.getItem<BookingItem[]>(STORAGE_KEYS.CART);
    if (items && Array.isArray(items)) {
      return items;
    }
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.CART);
    if (fallback) {
      return JSON.parse(fallback);
    }
  } catch (err) {
    console.warn('Failed to load cart from localforage:', err);
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.CART);
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Save Vendor Bookings
 */
export async function saveBookingsToStorage(bookings: VendorBooking[]): Promise<void> {
  try {
    await usilStorage.setItem(STORAGE_KEYS.VENDOR_BOOKINGS, bookings);
    safeLocalStorage.setItem(STORAGE_KEYS.VENDOR_BOOKINGS, JSON.stringify(bookings));
  } catch (err) {
    console.warn('Failed to save bookings to localforage:', err);
    safeLocalStorage.setItem(STORAGE_KEYS.VENDOR_BOOKINGS, JSON.stringify(bookings));
  }
}

/**
 * Load Vendor Bookings
 */
export async function loadBookingsFromStorage(): Promise<VendorBooking[] | null> {
  try {
    const bookings = await usilStorage.getItem<VendorBooking[]>(STORAGE_KEYS.VENDOR_BOOKINGS);
    if (bookings && Array.isArray(bookings) && bookings.length > 0) {
      return bookings;
    }
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.VENDOR_BOOKINGS);
    if (fallback) {
      return JSON.parse(fallback);
    }
  } catch (err) {
    console.warn('Failed to load bookings from localforage:', err);
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.VENDOR_BOOKINGS);
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Save Order Trackings
 */
export async function saveOrderTrackingsToStorage(trackings: ClientOrderTracking[]): Promise<void> {
  try {
    await usilStorage.setItem(STORAGE_KEYS.ORDER_TRACKINGS, trackings);
    safeLocalStorage.setItem(STORAGE_KEYS.ORDER_TRACKINGS, JSON.stringify(trackings));
  } catch (err) {
    console.warn('Failed to save trackings to storage:', err);
    safeLocalStorage.setItem(STORAGE_KEYS.ORDER_TRACKINGS, JSON.stringify(trackings));
  }
}

/**
 * Load Order Trackings
 */
export async function loadOrderTrackingsFromStorage(): Promise<ClientOrderTracking[] | null> {
  try {
    const trackings = await usilStorage.getItem<ClientOrderTracking[]>(STORAGE_KEYS.ORDER_TRACKINGS);
    if (trackings && Array.isArray(trackings) && trackings.length > 0) {
      return trackings;
    }
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.ORDER_TRACKINGS);
    if (fallback) {
      return JSON.parse(fallback);
    }
  } catch (err) {
    console.warn('Failed to load trackings from storage:', err);
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.ORDER_TRACKINGS);
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Save Inventory Items
 */
export async function saveInventoryToStorage(items: InventoryItem[]): Promise<void> {
  try {
    await usilStorage.setItem(STORAGE_KEYS.INVENTORY, items);
    safeLocalStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save inventory to storage:', err);
    safeLocalStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }
}

/**
 * Load Inventory Items
 */
export async function loadInventoryFromStorage(): Promise<InventoryItem[] | null> {
  try {
    const items = await usilStorage.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY);
    if (items && Array.isArray(items) && items.length > 0) {
      return items;
    }
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (fallback) {
      return JSON.parse(fallback);
    }
  } catch (err) {
    console.warn('Failed to load inventory from storage:', err);
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Save & Load Draft Booking Form (Inputs in BookingDrawer)
 */
export interface DraftBookingForm {
  customerName: string;
  customerPhone: string;
  eventDate: string;
  eventCity: string;
  generalNotes: string;
  paymentMethod: 'moyasar' | 'apple_pay' | 'mada' | 'bank_transfer' | 'whatsapp';
}

export async function saveDraftBookingForm(draft: DraftBookingForm): Promise<void> {
  try {
    await usilStorage.setItem(STORAGE_KEYS.DRAFT_BOOKING_FORM, draft);
    safeLocalStorage.setItem(STORAGE_KEYS.DRAFT_BOOKING_FORM, JSON.stringify(draft));
  } catch (err) {
    safeLocalStorage.setItem(STORAGE_KEYS.DRAFT_BOOKING_FORM, JSON.stringify(draft));
  }
}

export async function loadDraftBookingForm(): Promise<DraftBookingForm | null> {
  try {
    const draft = await usilStorage.getItem<DraftBookingForm>(STORAGE_KEYS.DRAFT_BOOKING_FORM);
    if (draft) return draft;
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.DRAFT_BOOKING_FORM);
    if (fallback) return JSON.parse(fallback);
  } catch {
    const fallback = safeLocalStorage.getItem(STORAGE_KEYS.DRAFT_BOOKING_FORM);
    if (fallback) {
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Full Database Backup Model
 */
export interface FullDatabaseBackup {
  meta: {
    appName: string;
    version: string;
    exportedAt: string;
    exportTimestamp: number;
    platform: string;
    storageEngine: string;
    totalKeys: number;
    totalRecords: number;
    checksum: string;
  };
  localforageRawDump: Record<string, any>;
  storeData: Record<string, any>;
}

/**
 * Generate a complete manual snapshot of localforage & active store data
 */
export async function createFullDatabaseBackup(
  runtimeStoreData?: Record<string, any>
): Promise<FullDatabaseBackup> {
  const rawDump: Record<string, any> = {};

  try {
    const keys = await usilStorage.keys();
    for (const key of keys) {
      try {
        rawDump[key] = await usilStorage.getItem(key);
      } catch (err) {
        console.warn(`Failed reading key ${key} from localforage:`, err);
      }
    }
  } catch (err) {
    console.warn('Failed iterating localforage keys:', err);
  }

  // Also include localStorage fallback items with usil_ prefix
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('usil_') && !(k in rawDump)) {
          try {
            rawDump[k] = JSON.parse(localStorage.getItem(k) || '');
          } catch {
            rawDump[k] = localStorage.getItem(k);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  let driver = 'localforage (IndexedDB/WebSQL/LocalStorage)';
  try {
    driver = usilStorage.driver() || driver;
  } catch {
    // ignore
  }

  const exportTimestamp = Date.now();
  const dateStr = new Date().toISOString();

  // Simple quick checksum for verification
  const rawDumpString = JSON.stringify(rawDump);
  const checksum = `SHA-${Math.abs(
    rawDumpString.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  ).toString(16)}`;

  let totalRecords = 0;
  if (runtimeStoreData) {
    Object.values(runtimeStoreData).forEach((val) => {
      if (Array.isArray(val)) {
        totalRecords += val.length;
      } else if (val && typeof val === 'object') {
        totalRecords += 1;
      }
    });
  }

  return {
    meta: {
      appName: 'منصة يوصل للضيافة والتجهيز (Usil Hospitality Platform)',
      version: '2.5.0',
      exportedAt: dateStr,
      exportTimestamp,
      platform: 'Vendor OS / Local Database Engine',
      storageEngine: driver,
      totalKeys: Object.keys(rawDump).length,
      totalRecords,
      checksum,
    },
    localforageRawDump: rawDump,
    storeData: runtimeStoreData || {},
  };
}

/**
 * Trigger browser file download for JSON object
 */
export function downloadJSONBackupFile(data: any, fileName?: string): string {
  const dateSuffix = new Date().toISOString().split('T')[0];
  const finalFileName = fileName || `aseel_store_backup_${dateSuffix}.json`;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return finalFileName;
}

