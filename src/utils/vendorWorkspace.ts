export type VendorWorkspacePayload = {
  bookings?: unknown[];
  blockedDates?: unknown[];
  inventoryItems?: unknown[];
  contracts?: unknown[];
  listings?: unknown[];
  socials?: unknown;
  /** Public profile fields (e.g. `logoUrl`, which must be one of the server's uploads). */
  profile?: { projectName?: string; logoUrl?: string };
  office?: VendorOffice;
};

/**
 * The back office's own books — invoices, crew, accounting, POS, brand — kept on
 * the server next to the workspace (`office` on GET/PUT /api/vendor/workspace).
 * The server treats it as opaque per-vendor data under a fixed key whitelist.
 */
export type VendorOffice = {
  invoices?: unknown[];
  crewMembers?: unknown[];
  expenses?: unknown[];
  payrollEntries?: unknown[];
  consolidatedVouchers?: unknown[];
  payouts?: unknown[];
  posItems?: unknown[];
  posSales?: unknown[];
  receivables?: unknown[];
  trackings?: unknown[];
  brandSettings?: Record<string, unknown>;
};

const OFFICE_LISTS = [
  'invoices',
  'crewMembers',
  'expenses',
  'payrollEntries',
  'consolidatedVouchers',
  'payouts',
  'posItems',
  'posSales',
  'receivables',
  'trackings',
] as const;

export type VendorOfficeList = (typeof OFFICE_LISTS)[number];

/** Every list present (empty when missing or malformed) plus brand settings when the vendor saved any. */
export function officeFromServer(raw: unknown): Record<VendorOfficeList, unknown[]> & {
  brandSettings: Record<string, unknown> | null;
} {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const lists = Object.fromEntries(
    OFFICE_LISTS.map((key) => [key, Array.isArray(src[key]) ? (src[key] as unknown[]) : []]),
  ) as Record<VendorOfficeList, unknown[]>;
  const brand = src.brandSettings;
  return {
    ...lists,
    brandSettings: brand && typeof brand === 'object' && !Array.isArray(brand) ? (brand as Record<string, unknown>) : null,
  };
}

/** JSON of each saved section as the server last had it: `listings`, `office.invoices`, … */
export type WorkspaceSnapshot = Record<string, string>;

const TOP_SECTIONS = ['inventoryItems', 'contracts', 'listings'] as const;
const OFFICE_SECTIONS = [...OFFICE_LISTS, 'brandSettings'] as const;

function sectionsOf(payload: VendorWorkspacePayload): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const key of TOP_SECTIONS) if (payload[key] !== undefined) out.push([key, payload[key]]);
  for (const key of OFFICE_SECTIONS) {
    if (payload.office?.[key] !== undefined) out.push([`office.${key}`, payload.office[key]]);
  }
  return out;
}

export function snapshotWorkspace(payload: VendorWorkspacePayload): WorkspaceSnapshot {
  return Object.fromEntries(sectionsOf(payload).map(([key, value]) => [key, JSON.stringify(value)]));
}

/**
 * Only the sections that differ from what the server last had. A tab holding a
 * stale copy then can't wipe what another tab, device or supervisor saved in a
 * section this tab never touched. `null` when nothing changed.
 */
export function changedWorkspace(
  payload: VendorWorkspacePayload,
  synced: WorkspaceSnapshot,
): { payload: VendorWorkspacePayload; snapshot: WorkspaceSnapshot } | null {
  const changed: VendorWorkspacePayload = {};
  const snapshot: WorkspaceSnapshot = {};
  for (const [key, value] of sectionsOf(payload)) {
    const json = JSON.stringify(value);
    if (synced[key] === json) continue;
    snapshot[key] = json;
    if (key.startsWith('office.')) {
      changed.office = { ...changed.office, [key.slice('office.'.length)]: value };
    } else {
      (changed as Record<string, unknown>)[key] = value;
    }
  }
  return Object.keys(snapshot).length ? { payload: changed, snapshot } : null;
}

/** A platform order as GET /api/bookings returns it to its vendor (own lines only). */
export type VendorPlatformOrder = {
  id: string;
  name?: string;
  phone?: string;
  serviceId?: unknown;
  serviceName?: string;
  notes?: string;
  city?: string;
  eventDate?: string;
  eventTime?: string;
  items?: unknown[];
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

const PLATFORM_CALENDAR_STATUS: Record<string, 'confirmed' | 'in_progress' | 'completed'> = {
  'مؤكد': 'confirmed',
  'قيد التنفيذ': 'in_progress',
  'مكتمل': 'completed',
};

/**
 * Orders the vendor accepted, as read-only calendar rows (`source: 'platform'`),
 * so the calendar, crew, expenses and P&L see them next to the vendor's own
 * bookings. Accepted but unpaid shows as awaiting payment, not as revenue.
 * Orders still waiting on the vendor, rejected or cancelled stay in the inbox only.
 */
export function platformOrdersAsCalendar(orders: unknown): Record<string, unknown>[] {
  if (!Array.isArray(orders)) return [];
  const out: Record<string, unknown>[] = [];
  for (const raw of orders as VendorPlatformOrder[]) {
    const accepted = raw && PLATFORM_CALENDAR_STATUS[String(raw.status || '')];
    if (!accepted || !raw.eventDate) continue;
    const paid = raw.paymentStatus === 'paid';
    const lines = (Array.isArray(raw.items) ? raw.items : []) as { id?: unknown; title?: unknown }[];
    const total = Number(raw.totalAmount) || 0;
    out.push({
      id: `platform-${raw.id}`,
      bookingNumber: raw.id,
      serviceId: String(lines[0]?.id ?? raw.serviceId ?? ''),
      serviceTitle: lines.map((line) => String(line?.title || '')).filter(Boolean).join(' + ') || raw.serviceName || 'طلب من المنصة',
      customerName: raw.name || 'عميل يوصل',
      customerPhone: raw.phone || '',
      date: String(raw.eventDate).slice(0, 10),
      startTime: raw.eventTime || '18:00',
      endTime: '23:30',
      city: raw.city || '',
      venueName: 'حسب عنوان العميل',
      guestCount: 0,
      totalAmount: total,
      depositAmount: paid ? total : 0,
      remainingAmount: paid ? 0 : total,
      source: 'platform',
      status: accepted === 'confirmed' && !paid ? 'pending_deposit' : accepted,
      notes: raw.notes || undefined,
      createdAt: raw.createdAt || '',
      readOnly: true,
    });
  }
  return out;
}

export async function fetchVendorPlatformOrders(vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/bookings', vendorId), { credentials: 'include' });
  return parse(res);
}

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

export async function fetchVendorSocials(vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/socials', vendorId), { credentials: 'include' });
  return parse(res);
}

export async function saveVendorSocials(payload: Record<string, unknown>, vendorId?: string | null) {
  const res = await fetch(vendorApiUrl('/api/vendor/socials', vendorId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return parse(res);
}
