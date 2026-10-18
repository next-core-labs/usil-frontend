import { normalizeSaudiMobile } from '../contracts/shared/booking-guards';

/**
 * Shape checks for the bank and tax details a vendor types into the back office.
 * They are printed on invoices and used for payouts, so a typo is caught here
 * rather than on a client's bank transfer. Each returns an Arabic message, or ''
 * when the value is fine or left empty (all of these are optional).
 */

export function normalizeIban(raw: string): string {
  return String(raw || '').replace(/\s+/g, '').toUpperCase();
}

/** Saudi IBAN: SA + 22 digits, with a valid ISO 13616 (mod 97) check. */
export function isValidSaudiIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^SA\d{22}$/.test(iban)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let rest = 0;
  for (const ch of digits) rest = (rest * 10 + Number(ch)) % 97;
  return rest === 1;
}

export function ibanProblem(raw: string): string {
  if (!normalizeIban(raw)) return '';
  return isValidSaudiIban(raw) ? '' : 'رقم الآيبان غير صحيح — يبدأ بـ SA ويتبعه 22 رقماً، انسخه كما هو من تطبيق البنك.';
}

/** ZATCA VAT number: 15 digits starting and ending with 3. */
export function vatProblem(raw: string): string {
  const value = String(raw || '').replace(/\s+/g, '');
  if (!value) return '';
  return /^3\d{13}3$/.test(value) ? '' : 'الرقم الضريبي 15 رقماً يبدأ وينتهي بـ 3.';
}

export function emailProblem(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'البريد الإلكتروني غير صحيح.';
}

export function mobileProblem(raw: string): string {
  if (!String(raw || '').trim()) return '';
  return normalizeSaudiMobile(raw) ? '' : 'رقم الجوال غير صحيح — اكتبه بصيغة 05xxxxxxxx.';
}
