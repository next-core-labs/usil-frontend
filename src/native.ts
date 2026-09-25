import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function bootNativeShell() {
  if (!isNativeApp()) return;

  document.documentElement.classList.add('usil-native');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0A1A33' });
  } catch {
    /* web */
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch {
    /* web */
  }

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
  });
}

/**
 * Hand the screen over to the app once React has actually painted, rather than
 * on a fixed timer — hiding early just swaps the splash for an empty navy body.
 * launchAutoHide in capacitor.config.ts remains the backstop if render throws.
 */
export function hideNativeSplash() {
  if (!isNativeApp()) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    });
  });
}
