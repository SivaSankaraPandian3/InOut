import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals


// Ensure any old service worker or caches from previous deployments are removed.
// This helps users get the new index.html without needing a manual hard refresh.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister().catch(() => {})))
    .catch(() => {});

  // Optionally clear runtime caches
  if (window.caches && window.caches.keys) {
    window.caches.keys()
      .then(keys => Promise.all(keys.map(k => window.caches.delete(k))))
      .catch(() => {});
  }
}

