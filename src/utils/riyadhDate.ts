/**
 * "Today" pinned to Saudi time (Asia/Riyadh, UTC+3, no DST) — never the
 * device timezone and never a hard-coded date.
 */

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Today's date in Riyadh as `YYYY-MM-DD`. */
export function riyadhToday(now: Date = new Date()): string {
  return new Date(now.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
}

/** The current Riyadh month as `YYYY-MM`. */
export function riyadhMonth(now: Date = new Date()): string {
  return riyadhToday(now).slice(0, 7);
}
