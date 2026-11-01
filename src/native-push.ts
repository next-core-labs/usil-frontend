import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Push notifications in the native shell, delivered through Firebase Cloud
 * Messaging. The backend sends to the token registered here for the signed-in
 * account (server/push/ in usil-backend); each message carries a `link` — a
 * store path, or a full console URL for vendors — that a tap opens.
 *
 * Without the Firebase files (android/app/google-services.json,
 * ios/App/App/GoogleService-Info.plist) this stays off: Android's register()
 * would crash with no Firebase app, so MainActivity's PushSupport plugin is
 * asked first; iOS reports a registrationError from AppDelegate instead.
 */

const PushSupport = registerPlugin<{ isAvailable(): Promise<{ available: boolean }> }>('PushSupport');

/** Must match ANDROID_CHANNEL_ID in usil-backend/server/push/fcm.ts. */
const ANDROID_CHANNEL_ID = 'usil-updates';

export type PushHandlers = {
  /** A notification was tapped. */
  open: (link: string) => void;
  /** Android only: one arrived while the app is open (iOS shows its own banner). */
  foreground: (title: string, body: string, link: string) => void;
};

let token: string | null = null;
let listening = false;
let asking: Promise<void> | null = null;

function linkOf(data: unknown): string {
  const link = (data as { link?: unknown } | null)?.link;
  return typeof link === 'string' ? link : '';
}

async function postToken(path: '/api/push/register' | '/api/push/unregister', body: Record<string, string>) {
  await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Taps are handled from launch, signed in or not: a cold start from a
 * notification delivers the tap as soon as a listener exists.
 */
export function listenForPush(handlers: PushHandlers): void {
  if (!Capacitor.isNativePlatform() || listening) return;
  listening = true;
  const platform = Capacitor.getPlatform();

  void PushNotifications.addListener('registration', ({ value }) => {
    token = value;
    void postToken('/api/push/register', { token: value, platform, app: 'store' }).catch(() => undefined);
  });
  void PushNotifications.addListener('registrationError', (error) => {
    console.warn('[push] registration failed', error);
  });
  void PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const link = linkOf(notification.data);
    if (link) handlers.open(link);
  });
  if (platform === 'android') {
    void PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handlers.foreground(notification.title || '', notification.body || '', linkOf(notification.data));
    });
  }
}

async function firebaseReady(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return true;
  try {
    return (await PushSupport.isAvailable()).available;
  } catch {
    return false;
  }
}

/**
 * Called at launch: asks once for permission and registers this device with
 * Firebase. The token only reaches the backend while someone is signed in
 * (the register call answers 401 otherwise); enablePush sends it after sign-in.
 */
export function requestPushPermission(): Promise<void> {
  // Launch and a restored session can both ask at once; share the one prompt.
  asking ??= askAndRegister().finally(() => {
    asking = null;
  });
  return asking;
}

async function askAndRegister(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !(await firebaseReady())) return;
  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') return;
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'تحديثات يوصل',
        description: 'طلباتك ومدفوعاتك',
        importance: 4,
        visibility: 1,
      });
    }
    // Answers through the 'registration' listener, which sends the token to the backend.
    await PushNotifications.register();
  } catch (error) {
    console.warn('[push] could not enable', error);
  }
}

/** After sign-in: ties this device's token to the account, asking first if launch did not. */
export async function enablePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!token) return requestPushPermission();
  try {
    await postToken('/api/push/register', { token, platform: Capacitor.getPlatform(), app: 'store' });
  } catch {
    /* offline: the next launch registers again */
  }
}

/** Before logout, while the session still owns the token: this device stops hearing for that account. */
export async function disablePush(): Promise<void> {
  if (!token) return;
  try {
    await postToken('/api/push/unregister', { token });
  } catch {
    /* offline: the next sign-in on this device moves the token anyway */
  }
}
