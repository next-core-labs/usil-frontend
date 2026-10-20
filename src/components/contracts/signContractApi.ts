/**
 * The client's side of an electronic contract (`/sign/<token>`). No account:
 * the private link is the credential. Server: `usil backend/server/contracts/`.
 */

export type PublicContract = {
  number: string;
  vendorName: string;
  vendor: { name: string; logoUrl?: string; crNumber?: string };
  client: { name: string; phoneMasked?: string };
  event: { date: string; time?: string; location: string; service: string };
  amounts: { total: number; deposit: number; remaining: number; currency: 'SAR' };
  terms: string[];
  notes?: string;
  status: 'sent' | 'signed';
  contentHash: string;
  issuedBy?: { name: string; at: string };
  sentAt?: string;
  signedAt?: string;
  signature?: { name: string; signedAt: string };
};

export type SignOutcome =
  | { kind: 'ok'; contract: PublicContract }
  | { kind: 'changed'; message: string }
  | { kind: 'already_signed'; message: string; contract?: PublicContract }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

const NETWORK = 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';

function url(token: string): string {
  return `/api/contracts/sign/${encodeURIComponent(token)}`;
}

async function readJson(res: Response): Promise<Record<string, any>> {
  try {
    return (await res.json()) as Record<string, any>;
  } catch {
    return {};
  }
}

export async function fetchContract(token: string): Promise<SignOutcome> {
  let res: Response;
  try {
    res = await fetch(url(token), { cache: 'no-store', credentials: 'omit' });
  } catch {
    return { kind: 'error', message: NETWORK };
  }
  const json = await readJson(res);
  if (res.ok && json.data) return { kind: 'ok', contract: json.data as PublicContract };
  if (res.status === 404) return { kind: 'invalid', message: String(json.error || 'رابط العقد غير صالح أو أُلغي.') };
  return { kind: 'error', message: String(json.error || 'تعذر فتح العقد. حاول مرة أخرى.') };
}

export async function signContract(
  token: string,
  input: { name: string; signature: string; contentHash: string },
): Promise<SignOutcome> {
  let res: Response;
  try {
    res = await fetch(url(token), {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, agree: true }),
    });
  } catch {
    return { kind: 'error', message: NETWORK };
  }
  const json = await readJson(res);
  if (res.ok && json.data) return { kind: 'ok', contract: json.data as PublicContract };
  const message = String(json.error || 'تعذر حفظ التوقيع. حاول مرة أخرى.');
  if (res.status === 409 && json.code === 'already_signed') {
    return { kind: 'already_signed', message, contract: json.data as PublicContract | undefined };
  }
  if (res.status === 409) return { kind: 'changed', message };
  if (res.status === 404) return { kind: 'invalid', message };
  return { kind: 'error', message };
}
