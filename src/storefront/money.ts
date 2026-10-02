/** Prices are final and VAT-inclusive; Latin digits with tabular figures as the design specifies. */
export function money(amountSar: number, ar: boolean): string {
  const n = Number(amountSar) || 0;
  return `${n.toLocaleString('en')} ${ar ? 'ر.س' : 'SAR'}`;
}

const VAT_RATE = 0.15;

/** The VAT portion already inside a VAT-inclusive total. */
export function vatInside(grossSar: number): number {
  return Math.round((grossSar * VAT_RATE) / (1 + VAT_RATE));
}

export function formatCount(n: number): string {
  return Number(n || 0).toLocaleString('en');
}
