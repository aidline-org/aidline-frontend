'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failure ignored gracefully
      });

      const updateOnlineStatus = () => {
        setIsOffline(!navigator.onLine);
      };

      updateOnlineStatus();
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div
      aria-live="polite"
      className="border-b border-rule bg-paper-sunk px-4 py-2 text-center font-mono text-xs text-ink-soft"
      role="status"
    >
      You are currently offline. Showing cached content.
    </div>
  );
}
