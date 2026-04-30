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
    
    // Add timeout and retry logic to prevent port closure issues
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;
    
    const registerSW = () => {
      navigator.serviceWorker
        .register(swUrl, { scope: import.meta.env.BASE_URL })
        .then((reg) => {
          console.log('[SW] Registered:', reg.scope);
          
          // Handle service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[SW] Updated');
              }
            });
          });
          
          // Register background sync for offline queue
          window.addEventListener('online', () => {
            reg.sync?.register('flush-queue').catch(() => {});
          });
        })
        .catch((err) => {
          console.warn(`[SW] Registration failed (attempt ${retryCount + 1}):`, err);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(registerSW, retryDelay * retryCount);
          }
        });
    };
    
    registerSW();
  });
}
