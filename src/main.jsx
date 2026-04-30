import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './styles/theme.css';

const basename = import.meta.env.BASE_URL || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ── Service Worker registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use BASE_URL so the path is correct whether hosted at / or /BalanceIQ/
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope);
        window.addEventListener('online', () => {
          reg.sync?.register('flush-queue').catch(() => {});
        });
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
}
