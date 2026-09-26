import type { CrewMember, VendorBooking } from '../types';
import { phoneToWhatsApp } from './vendorContracts.ts';
import { whatsappChatUrl } from './ownerWhatsApp.ts';

/**
 * The vendor's WhatsApp desk: their clients (from bookings), their crew, and
 * Usil support. Like the owner's desk it uses click-to-chat, so messages go out
 * from the vendor's own WhatsApp.
 */

export type ClientContact = {
  /** Normalized international number — two bookings with 05… and +966… are one client. */
  key: string;
  name: string;
  phone: string;
  bookings: VendorBooking[];
  /** The booking a message is about by default: the next upcoming one, else the latest. */
  focus: VendorBooking;
  totalSpent: number;
};

/** One row per client phone, most relevant first: upcoming events by date, then past by recency. */
export function buildClientContacts(bookings: VendorBooking[], today = new Date().toISOString().slice(0, 10)): ClientContact[] {
  const byPhone = new Map<string, VendorBooking[]>();
  for (const booking of bookings) {
    const key = phoneToWhatsApp(booking.customerPhone);
    if (!key) continue;
    byPhone.set(key, [...(byPhone.get(key) || []), booking]);
  }

  const contacts: ClientContact[] = [];
  for (const [key, rows] of byPhone) {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = sorted.find((row) => row.date >= today && row.status !== 'cancelled');
    const latest = sorted[sorted.length - 1];
    const focus = upcoming || latest;
    contacts.push({
      key,
      name: latest.customerName || focus.customerName,
      phone: latest.customerPhone,
      bookings: sorted,
      focus,
      totalSpent: rows
        .filter((row) => row.status !== 'cancelled')
        .reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0),
    });
  }

  return contacts.sort((a, b) => {
    const aUp = a.focus.date >= today;
    const bUp = b.focus.date >= today;
    if (aUp !== bUp) return aUp ? -1 : 1;
    return aUp ? a.focus.date.localeCompare(b.focus.date) : b.focus.date.localeCompare(a.focus.date);
  });
}

export type Template = { id: string; label: string; body: string };

export const CLIENT_TEMPLATES: Template[] = [
  {
    id: 'confirm',
    label: 'تأكيد الحجز',
    body: 'أهلاً {name}،\nمعك {brand}. نأكد حجزك لـ {service} بتاريخ {date} الساعة {time} في {venue}.\nرقم الحجز: {bookingNumber}',
  },
  {
    id: 'reminder',
    label: 'تذكير بموعد المناسبة',
    body: 'أهلاً {name}،\nتذكير من {brand}: موعد {service} يوم {date} الساعة {time} في {venue}. نحن جاهزين، وإذا عندك أي تعديل بلغنا.',
  },
  {
    id: 'remaining',
    label: 'المبلغ المتبقي',
    body: 'أهلاً {name}،\nنذكّرك بالمبلغ المتبقي لحجز {service} ({bookingNumber}): {remaining} ر.س.\nشكراً لاختيارك {brand}.',
  },
  {
    id: 'on_the_way',
    label: 'الطاقم في الطريق',
    body: 'أهلاً {name}،\nطاقم {brand} في الطريق إلى {venue} لتجهيز {service}. نوصل قريباً بإذن الله.',
  },
  {
    id: 'thanks',
    label: 'شكر وطلب تقييم',
    body: 'أهلاً {name}،\nشكراً لثقتك في {brand} 🌟 نتمنى أن {service} كانت على قد توقعاتك. يسعدنا تقييمك لنا في يوصل.',
  },
  { id: 'custom', label: 'رسالة حرة', body: '' },
];

export const CREW_TEMPLATES: Template[] = [
  {
    id: 'assignment',
    label: 'تكليف بمناسبة',
    body: 'أهلاً {name}،\nعندك مناسبة مع {brand}: {service} يوم {date} الساعة {time} في {venue} ({city}).\nعدد الضيوف: {guests}. أكد استلامك للمهمة.',
  },
  {
    id: 'shift_reminder',
    label: 'تذكير بالمناوبة',
    body: 'أهلاً {name}،\nتذكير بمناوبتك يوم {date} الساعة {time} في {venue}. الرجاء الحضور قبل الموعد بنصف ساعة.',
  },
  { id: 'custom', label: 'رسالة حرة', body: '' },
];

export const SUPPORT_TEMPLATES: Template[] = [
  {
    id: 'listing',
    label: 'اعتماد منتج',
    body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. أضفت منتج جديد وأحتاج متابعة اعتماده.',
  },
  {
    id: 'payout',
    label: 'المستحقات والتحويل',
    body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. عندي استفسار بخصوص المستحقات والتحويل البنكي.',
  },
  {
    id: 'order',
    label: 'مشكلة في طلب',
    body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. عندي مشكلة في طلب رقم: ',
  },
  {
    id: 'technical',
    label: 'مشكلة تقنية',
    body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. واجهت مشكلة تقنية في لوحة المورد: ',
  },
  {
    id: 'account',
    label: 'الحساب والوثائق',
    body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. أحتاج تحديث بيانات حسابي أو وثائقي.',
  },
  { id: 'custom', label: 'رسالة حرة', body: 'السلام عليكم إدارة يوصل،\nمعكم {brand}. ' },
];

export function templateBody(templates: Template[], id: string): string {
  return templates.find((item) => item.id === id)?.body || '';
}

const money = (value: number) => Number(value || 0).toLocaleString('ar-SA');

/**
 * Fills {placeholders}. Booking fields fall back to a neutral word so a
 * template never goes out with raw braces when the booking lacks a value.
 */
export function fillTemplate(
  body: string,
  values: { name?: string; brand?: string; booking?: VendorBooking | null },
): string {
  const b = values.booking;
  const map: Record<string, string> = {
    name: values.name || 'عميلنا العزيز',
    brand: values.brand || 'فريقنا',
    service: b?.serviceTitle || 'الخدمة',
    date: b?.date || 'الموعد المتفق عليه',
    time: b?.startTime || 'الوقت المتفق عليه',
    venue: b?.venueName || b?.city || 'موقع المناسبة',
    city: b?.city || '',
    guests: b?.guestCount ? String(b.guestCount) : '—',
    bookingNumber: b?.bookingNumber || '—',
    amount: money(b?.totalAmount || 0),
    remaining: money(b?.remainingAmount || 0),
  };
  return body.replace(/\{(\w+)\}/g, (match, key: string) => (key in map ? map[key] : match));
}

export function crewChatUrl(member: Pick<CrewMember, 'phone'>, text: string): string {
  return whatsappChatUrl(member.phone, text);
}
