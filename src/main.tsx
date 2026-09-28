// Ensure window.fetch is writable and settable in iframe/sandbox environments
(function() {
  try {
    const g = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g) {
      const makeSettable = (target: any) => {
        try {
          const cur = target.fetch;
          if (typeof cur === 'function') {
            try {
              Object.defineProperty(target, 'fetch', {
                value: cur,
                writable: true,
                configurable: true,
                enumerable: true,
              });
            } catch {
              let f = cur;
              Object.defineProperty(target, 'fetch', {
                get() { return f; },
                set(v) { f = v; },
                configurable: true,
                enumerable: true,
              });
            }
          }
        } catch {
          // ignore
        }
      };

      makeSettable(g);
      if (typeof Window !== 'undefined' && Window.prototype) {
        makeSettable(Window.prototype);
      }
    }
  } catch {
    // ignore
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
