export const INVOICE_VAT_RATE = 0.15;

export type InvoiceLineInput = { description: string; quantity: number; unitPrice: number };

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Invoice lines and totals. Platform prices are final and VAT-inclusive, so by
 * default the price the vendor types is the gross the client pays: VAT is taken
 * out of it, never added on top. Stored lines are always before VAT, which is
 * what the invoice PDF expects.
 */
export function invoiceTotals(lines: InvoiceLineInput[], pricesIncludeVat = true) {
  const items = lines.map((line) => {
    const quantity = Number(line.quantity) || 0;
    const entered = Number(line.unitPrice) || 0;
    const unitPrice = round2(pricesIncludeVat ? entered / (1 + INVOICE_VAT_RATE) : entered);
    return { description: line.description, quantity, unitPrice, total: round2(quantity * unitPrice) };
  });
  const entered = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
  const total = round2(pricesIncludeVat ? entered : entered * (1 + INVOICE_VAT_RATE));
  const subtotal = round2(pricesIncludeVat ? entered / (1 + INVOICE_VAT_RATE) : entered);
  return { items, subtotal, taxRate: INVOICE_VAT_RATE, taxAmount: round2(total - subtotal), total };
}
