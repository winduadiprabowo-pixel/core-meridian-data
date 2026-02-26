/**
 * main.tsx — ZERØ MERIDIAN 2026 push75
 * push75: Removed duplicate SW registration (was also in index.html → race condition).
 * SW is now registered exclusively in index.html inline script.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.tsx';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('[ZM] Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
