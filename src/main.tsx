import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import App from './App.tsx';
import './index.css';
import { bootNativeShell, hideNativeSplash, isNativeApp } from './native';
import { installNativeApiOrigin } from './native-origin';
import { AppErrorBoundary } from './components/AppErrorBoundary';

// Must precede the first request or render so /api and /uploads resolve
// against the live API instead of the local bundle.
installNativeApiOrigin();

bootNativeShell();

function isLiveUsilHost() {
  const host = window.location.hostname;
  return host === 'usil.app' || host === 'www.usil.app';
}

async function dropLocalServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('usil-') || key.startsWith('midyaf-'))
      .map((key) => caches.delete(key)),
  );
}

if ('serviceWorker' in navigator && !isNativeApp()) {
  if (process.env.NODE_ENV === 'production' && isLiveUsilHost()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    void dropLocalServiceWorkers();
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

hideNativeSplash();
