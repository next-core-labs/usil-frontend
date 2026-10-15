/**
 * Pure helpers for the admin bookings table: response parsing that never
 * throws, refund/duplicate-payment state, and the warnings an admin must
 * confirm before a status change. Kept out of AdminDashboard.tsx so they can
 * be tested without a DOM.
 */

import {
  BOOKING_NEW_STATUS,
  BOOKING_PENDING_APPROVAL_STATUS,
  BOOKING_REJECTED_STATUS,
} from '../contracts/vendors/vendor-listings';

export const BOOKING_NEW = BOOKING_NEW_STATUS;
export const BOOKING_PENDING_APPROVAL = BOOKING_PENDING_APPROVAL_STATUS;
export const BOOKING_CONFIRMED = 'مؤكد';
export const BOOKING_REJECTED = BOOKING_REJECTED_STATUS;
export const BOOKING_IN_PROGRESS = 'قيد التنفيذ';
export const BOOKING_COMPLETED = 'مكتمل';
export const BOOKING_CANCELLED = 'ملغي';

/** Statuses after which nothing is left to do — changing them is an override. */
export const FINAL_BOOKING_STATUSES: readonly string[] = [BOOKING_CANCELLED, BOOKING_REJECTED, BOOKING_COMPLETED];

/** Statuses that end an order without it happening — a paid one then owes a refund. */
export const ENDING_BOOKING_STATUSES: readonly string[] = [BOOKING_CANCELLED, BOOKING_REJECTED];

export type RefundStatus = 'pending' | 'none' | 'not_applicable' | 'refunded';

export type AdminBookingCancellation = {
  cancelledAt?: string;
  cancelledBy?: 'client' | 'vendor' | 'admin';
  refundPercent?: number;
  /** Owed back, in halalas. */
  refundHalalas?: number;
  refundStatus?: RefundStatus;
  refundedAt?: string;
  note?: string;
};

export type DuplicatePayment = {
  paymentId: string;
  /** Riyals, as the backend records it. */
  amount?: number;
  at?: string;
  refundStatus?: 'pending' | 'refunded';
  refundedAt?: string;
};

export type AdminBookingRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceName: string;
  notes?: string;
  status: string;
  createdAt: string;
  items?: Array<{ id?: string; title?: string; quantity?: number; price?: number; vendorId?: string }>;
  vendorIds?: string[];
  eventDate?: string;
  eventTime?: string;
  city?: string;
  totalAmount?: number;
  bookingMode?: 'instant' | 'approval';
  paymentStatus?: 'unpaid' | 'paid';
  paymentUrl?: string;
  cancellation?: AdminBookingCancellation;
  duplicatePayments?: DuplicatePayment[];
};

export type JsonResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string;
};

type ApiBody = { success?: boolean; error?: string } & Record<string, unknown>;

/**
 * Reads a fetch Response as JSON without ever throwing: a proxy error page,
 * an empty 204 or a truncated body all come back as `{ ok: false, error }`.
 */
export async function readApiResponse<T extends ApiBody = ApiBody>(
  res: Response,
  fallbackError: string,
): Promise<JsonResult<T>> {
  let body: T | null = null;
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as T) : null;
  } catch {
    body = null;
  }
  const ok = res.ok && Boolean(body) && body?.success !== false;
  const serverError = body && typeof body.error === 'string' ? body.error : '';
  return {
    ok,
    status: res.status,
    data: body,
    error: ok ? '' : serverError || fallbackError,
  };
}

/** fetch + readApiResponse; a network failure is a result too, never a throw. */
export async function requestApi<T extends ApiBody = ApiBody>(
  url: string,
  init: RequestInit | undefined,
  fallbackError: string,
): Promise<JsonResult<T>> {
  try {
    const res = await fetch(url, { credentials: 'include', ...init });
    return await readApiResponse<T>(res, fallbackError);
  } catch {
    return { ok: false, status: 0, data: null, error: 'تعذر الاتصال بالخادم.' };
  }
}

export function isPaid(row: Pick<AdminBookingRow, 'paymentStatus'>): boolean {
  return row.paymentStatus === 'paid';
}

export function hasPendingRefund(row: Pick<AdminBookingRow, 'cancellation'>): boolean {
  return row.cancellation?.refundStatus === 'pending';
}

export function isRefunded(row: Pick<AdminBookingRow, 'cancellation'>): boolean {
  return row.cancellation?.refundStatus === 'refunded';
}

export function hasDuplicatePayments(row: Pick<AdminBookingRow, 'duplicatePayments'>): boolean {
  return Array.isArray(row.duplicatePayments) && row.duplicatePayments.length > 0;
}

/** A second payment on the order that hasn't been sent back yet. */
export function hasPendingDuplicateRefund(row: Pick<AdminBookingRow, 'duplicatePayments'>): boolean {
  return Array.isArray(row.duplicatePayments) && row.duplicatePayments.some((dup) => dup.refundStatus !== 'refunded');
}

/** A refund is owed when a cancellation is pending or a customer paid twice. */
export function owesRefund(row: Pick<AdminBookingRow, 'cancellation' | 'duplicatePayments'>): boolean {
  return hasPendingRefund(row) || hasPendingDuplicateRefund(row);
}

export function vendorCount(row: Pick<AdminBookingRow, 'vendorIds' | 'items'>): number {
  if (Array.isArray(row.vendorIds) && row.vendorIds.length) return new Set(row.vendorIds).size;
  const fromItems = (row.items || []).map((item) => item?.vendorId).filter(Boolean);
  return new Set(fromItems).size;
}

/** An order spanning several vendors cannot be approved by any one of them. */
export function needsAdminApproval(row: Pick<AdminBookingRow, 'status' | 'vendorIds' | 'items'>): boolean {
  return row.status === BOOKING_PENDING_APPROVAL && vendorCount(row) > 1;
}

const SAR = new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 });

export function formatSar(amount: number | undefined | null): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  return `${SAR.format(value)} ر.س`;
}

export function formatHalalas(halalas: number | undefined | null): string {
  const value = Number(halalas);
  if (!Number.isFinite(value)) return '—';
  return formatSar(value / 100);
}

/**
 * Everything an admin should knowingly accept before moving `row` to `to`.
 * Empty means the change is routine and needs no confirmation.
 */
export function statusChangeWarnings(
  row: Pick<AdminBookingRow, 'status' | 'paymentStatus' | 'cancellation'>,
  to: string,
): string[] {
  const from = row.status;
  if (from === to) return [];
  const warnings: string[] = [];
  if (FINAL_BOOKING_STATUSES.includes(from)) {
    warnings.push(`الحالة «${from}» نهائية — تغييرها تجاوز إداري يُسجَّل في سجل الخادم.`);
  }
  if (to === BOOKING_NEW) {
    warnings.push('إرجاع الطلب إلى «جديد» يعيده لقائمة الطلبات الجديدة عند المورّد.');
  }
  const ending = ENDING_BOOKING_STATUSES.includes(to) && !ENDING_BOOKING_STATUSES.includes(from);
  if (ending && isPaid(row)) {
    warnings.push(
      `الطلب مدفوع — تحويله إلى «${to}» يُنشئ التزام استرداد كامل المبلغ للعميل عبر ميسر.`,
    );
  }
  if (!isPaid(row) && (to === BOOKING_IN_PROGRESS || to === BOOKING_COMPLETED)) {
    warnings.push('الطلب غير مدفوع — بدء التنفيذ أو إكماله قبل الدفع تجاوز إداري.');
  }
  return warnings;
}

export type BookingFilter = 'all' | 'pending_approval' | 'refund_due';

export function filterBookings<T extends AdminBookingRow>(rows: T[], filter: BookingFilter): T[] {
  if (filter === 'pending_approval') return rows.filter((row) => row.status === BOOKING_PENDING_APPROVAL);
  if (filter === 'refund_due') return rows.filter(owesRefund);
  return rows;
}
