// Service Worker for Wadaage Taxi PWA
const CACHE_NAME = 'wadaage-taxi-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Background Push Notification Event
self.addEventListener('push', (event) => {
  let data = {
    title: '🚖 Dalab Wadaage Cusub ah!',
    body: 'Dalab rakaab cusub ayaa soo gaadhay taleefankaaga.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 100, 300, 100, 500],
    data: { url: '/?app=driver' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: data.vibrate || [300, 100, 300, 100, 500],
    tag: 'wadaage-order-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/?app=driver' },
    actions: [
      { action: 'open_order', title: '🚖 Fur Dalabka (Open)' },
      { action: 'dismiss', title: 'Xidh (Dismiss)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler - Focus or Open App Tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
