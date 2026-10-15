/**
 * Extra calendar helpers pinned to Saudi time (Asia/Riyadh, UTC+3, no DST).
 * `riyadhToday()` / `riyadhMonth()` live in ./riyadhDate; this file adds the
 * pieces the vendor back-office screens need on top (labels, quarters, times).
 */

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function riyadhShifted(now: Date = new Date()): Date {
  return new Date(now.getTime() + RIYADH_OFFSET_MS);
}

function riyadhDateKey(now: Date): string {
  const d = riyadhShifted(now);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Current Riyadh year and zero-based month index. */
export function riyadhYearMonth(now: Date = new Date()): { year: number; month: number } {
  const d = riyadhShifted(now);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/** Riyadh wall-clock timestamp `YYYY-MM-DD HH:mm:ss`. */
export function riyadhDateTime(now: Date = new Date()): string {
  const d = riyadhShifted(now);
  return `${riyadhDateKey(now)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Riyadh wall-clock time `HH:mm`. */
export function riyadhTime(now: Date = new Date()): string {
  const d = riyadhShifted(now);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Riyadh `YYYY-MM-DD` for an arbitrary timestamp / ISO string (null if invalid). */
export function toRiyadhDate(value: string | number | Date | undefined | null): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !value.includes('T')) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return riyadhDateKey(d);
}

/** Arabic month names (Gregorian), January first. */
export const ARABIC_MONTH_NAMES: readonly string[] = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** «أكتوبر 2026» for a `YYYY-MM` key. */
export function arabicMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return monthKey;
  return `${ARABIC_MONTH_NAMES[m - 1]} ${y}`;
}

/** Quarter (1-4) of a `YYYY-MM-DD` / `YYYY-MM` string. */
export function quarterOf(dateKey: string): number {
  const m = Number(dateKey.slice(5, 7));
  return Math.floor((m - 1) / 3) + 1;
}
