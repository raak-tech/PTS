"use client";

import { useEffect, useState } from 'react';

export function NotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleNotifications = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      if (isEnabled) {
        // Disable — just update UI and server state
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: 'browser' }),
        }).catch(() => {});
        setIsEnabled(false);
      } else {
        // Request permission and register service worker
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          } catch (err) {
            console.warn('Service worker registration failed (optional for pilot):', err);
          }

          // Save preference to server
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: 'browser',
              auth: 'browser-notification',
              p256dh: 'browser-notification',
            }),
          });
          setIsEnabled(true);
        }
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleNotifications}
      disabled={isLoading}
      style={{
        padding: '10px 16px',
        borderRadius: 999,
        border: isEnabled ? '1.5px solid #111' : 'none',
        background: isEnabled ? 'transparent' : '#111',
        color: isEnabled ? '#111' : 'white',
        fontWeight: 600,
        fontSize: '14px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {isLoading ? 'Updating…' : isEnabled ? '🔔 Notifications ON' : '🔔 Enable reminders'}
    </button>
  );
}
