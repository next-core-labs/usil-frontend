/**
 * Web NFC Manager & Tap-to-Pay Engine for Usil POS Cashier
 * Supports Web NFC API (NDEFReader) in compatible mobile browsers (Chrome on Android)
 * with graceful fallback to interactive EMV Contactless NFC simulation & audio feedback.
 */

import { NFCPaymentData } from '../types';

export interface WebNfcStatus {
  isSupported: boolean;
  permissionStatus: 'granted' | 'prompt' | 'denied' | 'unsupported';
  isScanning: boolean;
  error?: string;
}

/**
 * Check if the current browser and hardware supports the Web NFC API
 */
export function isWebNfcSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'NDEFReader' in window;
}

/**
 * Web Audio API synthesizer for authentic POS Terminal sounds (Mada & EMV Contactless)
 */
export function playNfcBeep(type: 'card_touch' | 'success' | 'error' | 'processing') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === 'card_touch') {
      // Crisp 1400 Hz touch tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      // Standard Saudi Mada POS double-tone approval beep (1760 Hz + 2640 Hz)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1760, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2640, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === 'processing') {
      // Subtle pulsing tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'error') {
      // Low buzz error
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    // AudioContext autoplay policies or disabled audio
    console.debug('NFC Sound effect suppressed:', err);
  }
}

/**
 * Trigger device vibration for physical haptic feedback
 */
export function triggerNfcHaptic(pattern: 'tap' | 'success' | 'error') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    if (pattern === 'tap') {
      navigator.vibrate(60);
    } else if (pattern === 'success') {
      navigator.vibrate([80, 40, 120]);
    } else if (pattern === 'error') {
      navigator.vibrate([150, 50, 150]);
    }
  } catch {
    // Ignore unsupported vibration
  }
}

/**
 * Generate authenticated Tap-to-Pay EMV payload
 */
export function generateNfcPaymentPayload(
  scheme: 'mada' | 'apple_pay' | 'visa' | 'mastercard',
  realNfcData?: { serialNumber?: string; records?: any[] }
): NFCPaymentData {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const randomAuth = Math.floor(100000 + Math.random() * 900000);
  const rrn = `${Date.now().toString().slice(-6)}${Math.floor(100000 + Math.random() * 900000)}`;
  const terminalId = `TID-982${Math.floor(10 + Math.random() * 89)}`;

  let maskedPan = '•••• •••• •••• ' + randomSuffix;
  let aid = 'A0000002281010'; // Mada EMV AID
  let cardHolderName = 'بطاقة مدى تلامسية';

  if (scheme === 'mada') {
    maskedPan = `5888 •••• •••• ${randomSuffix}`;
    aid = 'A0000002281010 (MADA DEBIT)';
    cardHolderName = 'عميل مدى كاشير';
  } else if (scheme === 'apple_pay') {
    maskedPan = `4820 •••• •••• ${randomSuffix} (Apple Pay Device Token)`;
    aid = 'A0000000031010 (APPLE_PAY_EMV)';
    cardHolderName = 'Apple Pay Direct';
  } else if (scheme === 'visa') {
    maskedPan = `4111 •••• •••• ${randomSuffix}`;
    aid = 'A0000000031010 (VISA CREDIT/DEBIT)';
    cardHolderName = 'حامل بطاقة فيزا';
  } else if (scheme === 'mastercard') {
    maskedPan = `5412 •••• •••• ${randomSuffix}`;
    aid = 'A0000000041010 (MASTERCARD CL)';
    cardHolderName = 'حامل بطاقة ماستركارد';
  }

  const nfcTech = realNfcData?.serialNumber
    ? `ISO/IEC 14443-A (UID: ${realNfcData.serialNumber.toUpperCase()})`
    : 'NFC Forum Type 4 / EMV Contactless (13.56 MHz)';

  return {
    cardScheme: scheme,
    maskedPan,
    authCode: `AUTH-${randomAuth}`,
    rrn,
    terminalId,
    aid,
    cardHolderName,
    nfcTech,
    timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    contactlessVerified: true,
  };
}

/**
 * Web NFC Scanner Controller Class
 */
export class WebNfcPaymentScanner {
  private ndef: any = null;
  private abortController: AbortController | null = null;
  private isScanning = false;

  public async startScan(
    onCardDetected: (nfcData: { serialNumber?: string; records?: any[] }) => void,
    onError: (error: Error) => void
  ): Promise<boolean> {
    if (!isWebNfcSupported()) {
      return false;
    }

    try {
      this.abortController = new AbortController();
      const NDEFReaderClass = (window as any).NDEFReader;
      this.ndef = new NDEFReaderClass();

      await this.ndef.scan({ signal: this.abortController.signal });
      this.isScanning = true;

      this.ndef.addEventListener('reading', (event: any) => {
        const serialNumber = event.serialNumber || '';
        const records = event.message?.records || [];
        playNfcBeep('card_touch');
        triggerNfcHaptic('tap');
        onCardDetected({ serialNumber, records });
      });

      this.ndef.addEventListener('readingerror', () => {
        playNfcBeep('error');
        triggerNfcHaptic('error');
        onError(new Error('تعذر قراءة بطاقة الـ NFC، يرجى إعادة تقريب البطاقة من خلف الجهاز بهدوء.'));
      });

      return true;
    } catch (err: any) {
      this.isScanning = false;
      onError(err);
      return false;
    }
  }

  public stopScan() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isScanning = false;
  }

  public getStatus(): boolean {
    return this.isScanning;
  }
}
