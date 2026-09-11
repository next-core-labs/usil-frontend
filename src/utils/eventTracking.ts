export function phoneDigits(value?: string) {
  return (value || '').replace(/\D/g, '').replace(/^966/, '0');
}

export function parseEventEnd(eventDate?: string, endTime?: string): Date | null {
  const dateMatch = String(eventDate || '').match(/(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  const timeMatch = String(endTime || '23:59').match(/(\d{1,2}):(\d{2})/);
  const hours = timeMatch ? String(timeMatch[1]).padStart(2, '0') : '23';
  const minutes = timeMatch ? timeMatch[2] : '59';
  const parsed = new Date(`${dateMatch[1]}T${hours}:${minutes}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const ENDED_STATUSES = new Set(['completed', 'cancelled', 'مكتمل', 'ملغي']);

export function eventIsLive(eventDate?: string, endTime?: string, status?: string, now = new Date()): boolean {
  if (status && ENDED_STATUSES.has(status)) return false;
  const end = parseEventEnd(eventDate, endTime);
  if (!end) return false;
  return now.getTime() <= end.getTime();
}

export type LiveTrackingInput = {
  clientPhone?: string;
  eventDate?: string;
  eventTime?: string;
  status?: string;
};

export type LiveBookingInput = {
  customerPhone?: string;
  date?: string;
  endTime?: string;
  status?: string;
};

export function clientHasLiveEvent(input: {
  role?: string | null;
  phone?: string;
  trackings?: LiveTrackingInput[];
  bookings?: LiveBookingInput[];
  now?: Date;
}): boolean {
  if (input.role !== 'client') return false;
  const phone = phoneDigits(input.phone);
  if (!phone) return false;
  const now = input.now || new Date();

  const liveTracking = (input.trackings || []).some(
    (item) =>
      phoneDigits(item.clientPhone) === phone &&
      eventIsLive(item.eventDate, item.eventTime, item.status, now),
  );
  if (liveTracking) return true;

  return (input.bookings || []).some(
    (item) =>
      phoneDigits(item.customerPhone) === phone &&
      eventIsLive(item.date, item.endTime, item.status, now),
  );
}
