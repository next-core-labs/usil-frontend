import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * The native shell ships the built SPA from dist/ and talks to the live API.
 * Root-relative /api and /uploads requests are rewritten to API_ORIGIN at
 * runtime by src/native-origin.ts — see that file for why.
 */
const config: CapacitorConfig = {
  appId: 'sa.usil.app',
  appName: 'يوصل',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['usil.app', 'www.usil.app'],
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'usil',
    backgroundColor: '#0A1A33',
    // dist/ is local, and API traffic goes through CapacitorHttp rather than
    // the WebView, so App-Bound Domains would only block outbound links.
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    // Routes fetch/XHR through the native HTTP stack. The backend sends
    // SameSite=Lax cookies and no CORS headers, so browser-level cross-origin
    // calls from capacitor://localhost would fail; native requests are not
    // subject to CORS and use the platform cookie jar.
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1600,
      launchAutoHide: true,
      backgroundColor: '#0A1A33',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A1A33',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
