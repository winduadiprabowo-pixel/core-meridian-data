import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.tsx';
import './index.css';

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
  sync?: SyncManager;
}

async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope:          '/',
      updateViaCache: 'none',
    }) as ExtendedServiceWorkerRegistration;
    reg.addEventListener('updatefound', () => {
      const next = reg.installing;
      if (!next) return;
      next.addEventListener('statechange', () => {
        if (next.state === 'installed' && navigator.serviceWorker.controller) {
          console.info('[ZM SW] Update available — reload to apply.');
        }
      });
    });
  } catch (err) {
    console.warn('[ZM SW] Registration failed:', err);
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('[ZM] Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('requestIdleCallback' in window) {
  requestIdleCallback(registerSW);
} else {
  setTimeout(registerSW, 1000);
}
