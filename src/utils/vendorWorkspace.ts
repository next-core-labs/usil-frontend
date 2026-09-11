export type VendorWorkspacePayload = {
  bookings?: unknown[];
  blockedDates?: unknown[];
  inventoryItems?: unknown[];
  contracts?: unknown[];
  listings?: unknown[];
  socials?: unknown;
};

export function workspaceHasData(payload: VendorWorkspacePayload | null | undefined): boolean {
  if (!payload) return false;
  return Boolean(
    (Array.isArray(payload.bookings) && payload.bookings.length > 0) ||
      (Array.isArray(payload.blockedDates) && payload.blockedDates.length > 0) ||
      (Array.isArray(payload.inventoryItems) && payload.inventoryItems.length > 0) ||
      (Array.isArray(payload.contracts) && payload.contracts.length > 0) ||
      (Array.isArray(payload.listings) && payload.listings.length > 0),
  );
}

/** Server workspace is the source of truth — including a brand-new empty vendor. */
export function workspaceFromServer(payload: VendorWorkspacePayload | null | undefined): {
  bookings: unknown[];
  blockedDates: unknown[];
  inventoryItems: unknown[];
  contracts: unknown[];
  listings: unknown[];
} {
  return {
    bookings: Array.isArray(payload?.bookings) ? payload.bookings : [],
    blockedDates: Array.isArray(payload?.blockedDates) ? payload.blockedDates : [],
    inventoryItems: Array.isArray(payload?.inventoryItems) ? payload.inventoryItems : [],
    contracts: Array.isArray(payload?.contracts) ? payload.contracts : [],
    listings: Array.isArray(payload?.listings) ? payload.listings : [],
  };
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Vendor API ${res.status}`);
  }
  return data;
}

export function vendorApiUrl(path: string, vendorId?: string | null) {
  if (!vendorId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}vendorId=${encodeURIComponent(vendorId)}`;
}

export async function fetchVendorHubs() {
  const res = await fetch('/api/admin/vendor-hubs', { credentials: 'include' });
  return parse(res);
}

export async function fetchVendorWorkspace(vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/workspace', vendorId), { credentials: 'include' });
  return parse(res);
}

export async function saveVendorWorkspace(payload: VendorWorkspacePayload, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/workspace', vendorId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function createVendorBooking(payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/bookings', vendorId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updateVendorBooking(id: string, payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl(`/api/vendor/bookings/${id}`, vendorId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteVendorBooking(id: string, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl(`/api/vendor/bookings/${id}`, vendorId), {
    method: 'DELETE',
    credentials: 'include',
  });
  return parse(res);
}

export async function createBlockedDate(payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/blocked-dates', vendorId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteBlockedDate(id: string, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl(`/api/vendor/blocked-dates/${id}`, vendorId), {
    method: 'DELETE',
    credentials: 'include',
  });
  return parse(res);
}

export async function fetchVendorSummary(vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/summary', vendorId), { credentials: 'include' });
  return parse(res);
}

export async function fetchMyVendorFile() {
  const res = await fetch('/api/me/vendor-file', { credentials: 'include' });
  return parse(res);
}

export async function fetchCatalogListings() {
  const res = await fetch('/api/catalog/listings');
  return parse(res);
}

export async function createVendorListing(payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/listings', vendorId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updateVendorListing(id: string, payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl(`/api/vendor/listings/${id}`, vendorId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteVendorListing(id: string, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl(`/api/vendor/listings/${id}`, vendorId), {
    method: 'DELETE',
    credentials: 'include',
  });
  return parse(res);
}

export async function fetchVendorSocials() {
  const res = await fetch('/api/vendor/socials', { credentials: 'include' });
  return parse(res);
}

export async function saveVendorSocials(payload: Record<string, unknown>) {
  const res = await fetch('/api/vendor/socials', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}
