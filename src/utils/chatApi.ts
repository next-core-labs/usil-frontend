/**
 * In-app chat, client side. The server (`usil backend/server/chat/`) owns the
 * rules; this file only mirrors its shapes and calls it.
 *
 * - client ↔ vendor: a signed-in client and one vendor.
 * - vendor ↔ owner: a vendor and «فريق يوصل», the shared admin inbox.
 *
 * Delivery is polling, not sockets: the native shells send /api through
 * CapacitorHttp, which has no streaming, so polling is the one transport that
 * behaves the same on web, iOS and Android.
 */

export type ChatSide = 'client' | 'vendor' | 'owner';
export type ChatKind = 'client_vendor' | 'vendor_owner';
export type ChatContext = { type: 'listing' | 'booking'; id: string; title: string };

export type ChatMessage = {
  id: string;
  seq: number;
  side: ChatSide;
  senderId: string;
  senderName: string;
  body: string;
  context?: ChatContext;
  createdAt: string;
};

type ConversationBase = {
  id: string;
  kind: ChatKind;
  vendorId: string;
  vendorName: string;
  clientId?: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = ConversationBase & { lastMessage: ChatMessage | null; unread: number };
export type Conversation = ConversationBase & { messages: ChatMessage[] };

/** Mirrors the server cap so the composer can stop the user before a 400. */
export const MAX_CHAT_BODY = 2000;

/** How often an open thread and the inbox check for news. */
export const THREAD_POLL_MS = 5000;
export const INBOX_POLL_MS = 15000;
export const UNREAD_POLL_MS = 30000;

export const USIL_TEAM_LABEL = 'فريق يوصل';

/** Fired after a thread is marked read, so nav badges update without waiting for their poll. */
export const CHAT_READ_EVENT = 'usil:chat-read';

export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ChatApiError('تعذر الاتصال. تحقق من الإنترنت ثم أعد المحاولة.', 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new ChatApiError(json?.error || 'تعذر إتمام الطلب. حاول مرة أخرى.', res.status);
  }
  return json.data as T;
}

export const chatApi = {
  list: () => call<ConversationSummary[]>('/api/chats'),
  unread: () => call<{ count: number }>('/api/chats/unread').then((data) => data.count),
  get: (id: string, afterId?: string) =>
    call<Conversation>(
      `/api/chats/${encodeURIComponent(id)}${afterId ? `?after=${encodeURIComponent(afterId)}` : ''}`,
    ),
  /** Starts the pair's thread with its first message, or appends to it. Vendors omit vendorId. */
  start: (input: { vendorId?: string; body: string; context?: ChatContext }) =>
    call<Conversation>('/api/chats', input),
  send: (id: string, body: string, context?: ChatContext) =>
    call<ChatMessage>(`/api/chats/${encodeURIComponent(id)}/messages`, { body, context }),
  markRead: (id: string) =>
    call<void>(`/api/chats/${encodeURIComponent(id)}/read`, {}).then(() => {
      window.dispatchEvent(new Event(CHAT_READ_EVENT));
    }),
};

/** Append polled or just-sent messages, dropping any already held, in thread order. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (!incoming.length) return current;
  const seen = new Set(current.map((message) => message.id));
  const fresh = incoming.filter((message) => !seen.has(message.id));
  if (!fresh.length) return current;
  return [...current, ...fresh].sort((a, b) => a.seq - b.seq);
}

/** Who the viewer is talking to in this thread. */
export function counterpartName(row: ConversationBase, viewer: ChatSide): string {
  if (viewer === 'client') return row.vendorName;
  if (viewer === 'owner') return row.vendorName;
  return row.kind === 'vendor_owner' ? USIL_TEAM_LABEL : row.clientName || 'عميل';
}

/** The label above someone else's message. Owner-side messages always sign as the team. */
export function senderLabel(message: ChatMessage, row: ConversationBase): string {
  if (message.side === 'owner') return USIL_TEAM_LABEL;
  if (message.side === 'vendor') return row.vendorName || message.senderName;
  return row.clientName || message.senderName;
}

const TIME = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: '2-digit' });
// Gregorian on purpose: event dates across the app are Gregorian, and ar-SA defaults to Hijri.
const DAY = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });
const SHORT_DAY = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'short' });

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function messageTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/** «اليوم» / «أمس» / a date, for the separators between days in a thread. */
export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (sameDay(date, now)) return 'اليوم';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'أمس';
  return DAY.format(date);
}

/** The inbox row stamp: the time today, otherwise the date. */
export function inboxStamp(iso: string, now = new Date()): string {
  const date = new Date(iso);
  return sameDay(date, now) ? TIME.format(date) : SHORT_DAY.format(date);
}
