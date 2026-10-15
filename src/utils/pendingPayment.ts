/**
 * The order a shopper was sent to Moyasar to pay. The cart is only emptied once
 * the payment is verified (`/payment/success`); until then this lets a shopper
 * who backed out of Moyasar — guests included, who can't see «طلباتي» — resume
 * the same invoice instead of rebuilding the cart into a duplicate order.
 */
export type PendingPayment = {
  bookingId: string;
  paymentUrl: string;
  savedAt: number;
};

const KEY = 'usil_pending_payment';
/** Matches nothing on the server; a day is plenty to come back from the payment page. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isMoyasarUrl(url: string): boolean {
  try {
    const host = new URL(url, 'https://usil.app').hostname.toLowerCase();
    return host === 'moyasar.com' || host.endsWith('.moyasar.com');
  } catch {
    return false;
  }
}

export function savePendingPayment(bookingId: string, paymentUrl: string): void {
  if (!isMoyasarUrl(paymentUrl)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ bookingId, paymentUrl, savedAt: Date.now() } satisfies PendingPayment));
  } catch {
    /* private mode */
  }
}

export function loadPendingPayment(now = Date.now()): PendingPayment | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (!parsed.paymentUrl || !isMoyasarUrl(parsed.paymentUrl)) return null;
    if (typeof parsed.savedAt !== 'number' || now - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { bookingId: String(parsed.bookingId || ''), paymentUrl: parsed.paymentUrl, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
