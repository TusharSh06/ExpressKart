import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </HelmetProvider>
  </React.StrictMode>,
)

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", reg);

      // Optional: listen for updates and notify user
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New update available
            // You can dispatch a custom event or show toast to user
            window.dispatchEvent(new CustomEvent("sw-update-available"));
          }
        });
      });

      // Optional: auto-activate new SW
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service worker controller changed");
      });
    } catch (err) {
      console.error("SW registration failed:", err);
    }
  });
}
