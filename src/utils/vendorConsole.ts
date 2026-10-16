/**
 * Where vendors manage their store. The console is its own site with its own
 * sign-in (sessions are host-only), so the storefront links to it rather than
 * embedding it. Local dev runs it on 5190 next to this app; everything else —
 * production and the native shells — uses the live console.
 */
export function vendorConsoleUrl(email?: string): string {
  const host = typeof location === 'undefined' ? '' : location.hostname;
  const base = host === '127.0.0.1' || host === 'localhost' ? 'http://127.0.0.1:5190' : 'https://vendor.usil.app';
  return email ? `${base}/?email=${encodeURIComponent(email)}` : base;
}
