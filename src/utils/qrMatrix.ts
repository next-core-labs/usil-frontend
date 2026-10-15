/**
 * Real QR-code generation without a new dependency: html5-qrcode (already used
 * for scanning) ships the full ZXing build, which includes the QR *encoder*.
 * Loaded lazily so the ~1 MB bundle is only fetched when a QR is drawn.
 */

type ZxingByteMatrix = { getWidth(): number; getHeight(): number; get(x: number, y: number): number };
type ZxingModule = {
  QRCodeEncoder: { encode(content: string, ecLevel: unknown, hints: unknown): { getMatrix(): ZxingByteMatrix } };
  QRCodeDecoderErrorCorrectionLevel: { L: unknown; M: unknown; Q: unknown; H: unknown };
};

let zxingPromise: Promise<ZxingModule> | null = null;

function loadZxing(): Promise<ZxingModule> {
  if (!zxingPromise) {
    // @ts-ignore -- UMD bundle without usable typings; shape declared above.
    zxingPromise = import('html5-qrcode/third_party/zxing-js.umd.js').then((mod: unknown) => {
      const m = mod as { default?: ZxingModule } & Partial<ZxingModule>;
      return (m.QRCodeEncoder ? m : m.default) as ZxingModule;
    });
  }
  return zxingPromise;
}

/** QR module matrix for `text` (true = dark), without the quiet zone. */
export async function encodeQrMatrix(text: string): Promise<boolean[][]> {
  const zx = await loadZxing();
  const qr = zx.QRCodeEncoder.encode(text, zx.QRCodeDecoderErrorCorrectionLevel.M, null);
  const m = qr.getMatrix();
  const rows: boolean[][] = [];
  for (let y = 0; y < m.getHeight(); y++) {
    const row: boolean[] = [];
    for (let x = 0; x < m.getWidth(); x++) row.push(m.get(x, y) === 1);
    rows.push(row);
  }
  return rows;
}
