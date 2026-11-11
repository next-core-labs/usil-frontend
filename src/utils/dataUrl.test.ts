import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileToDataUrl } from './dataUrl';

describe('fileToDataUrl', () => {
  it('matches a real base64 encoding across several chunks', async () => {
    const bytes = new Uint8Array(100_000).map((_, i) => (i * 31 + 7) % 256);
    const url = await fileToDataUrl(new Blob([bytes], { type: 'image/png' }));
    assert.equal(url, `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`);
  });

  it('works without FileReader (iOS Lockdown Mode)', async () => {
    const saved = (globalThis as { FileReader?: unknown }).FileReader;
    delete (globalThis as { FileReader?: unknown }).FileReader;
    try {
      assert.equal(await fileToDataUrl(new Blob(['hi'], { type: 'image/webp' })), 'data:image/webp;base64,aGk=');
    } finally {
      if (saved) (globalThis as { FileReader?: unknown }).FileReader = saved;
    }
  });
});
