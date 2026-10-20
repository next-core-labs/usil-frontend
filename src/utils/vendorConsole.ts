import { isNativeApp } from '../native';

/**
 * Where vendors manage their store. The console is its own site with its own
 * sign-in (sessions are host-only), so the storefront links to it rather than
 * embedding it. Local dev runs it on 5190 next to this app; everything else —
 * production and the native shells (which also run on `localhost`) — uses the
 * live console.
 *
 * `vendorId` opens it for an admin or accounts manager supervising that vendor;
 * `email` prefills the console's sign-in.
 */
export function vendorConsoleUrl(options: string | { email?: string; vendorId?: string } = {}): string {
  const { email, vendorId } = typeof options === 'string' ? { email: options, vendorId: undefined } : options;
  const host = typeof location === 'undefined' ? '' : location.hostname;
  const local = !isNativeApp() && (host === '127.0.0.1' || host === 'localhost');
  const base = local ? 'http://127.0.0.1:5190' : 'https://vendor.usil.app';
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (vendorId) params.set('vendorId', vendorId);
  const query = params.toString();
  return query ? `${base}/?${query}` : base;
}

/** Leaves the store for the vendor console (the system browser in the native apps). */
export function openVendorConsole(options?: { email?: string; vendorId?: string }) {
  window.location.assign(vendorConsoleUrl(options));
}
