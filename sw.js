const CACHE_NAME = 'water-buddy-v6';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// Install event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event - Cache first, network fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match('/')))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Water Buddy 💧', {
      body: data.body || 'Time to hydrate!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230ea5e9" width="192" height="192" rx="32"/><text x="96" y="130" text-anchor="middle" font-size="100">💧</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%230ea5e9" width="96" height="96" rx="16"/><text x="48" y="68" text-anchor="middle" font-size="50">💧</text></svg>',
      vibrate: [200, 100, 200],
      tag: data.tag || 'water-reminder',
      data: { url: data.url || '/' },
      actions: [
        { action: 'add', title: '💧 Add 250ml' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'add') {
    // Could send message to app to add water
    e.waitUntil(clients.openWindow('/?action=add'));
  } else {
    e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
  }
});

// Background sync
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-water-data') {
    e.waitUntil(syncWaterData());
  }
});

async function syncWaterData() {
  // Future: Sync data with backend
  console.log('Syncing water data...');
}

// Periodic background sync (for reminders)
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'water-reminder') {
    e.waitUntil(showReminder());
  }
});

async function showReminder() {
  const clients = await self.clients.matchAll();
  if (clients.length === 0) {
    self.registration.showNotification('Water Buddy 💧', {
      body: "You haven't logged water in 2 hours!",
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230ea5e9" width="192" height="192" rx="32"/><text x="96" y="130" text-anchor="middle" font-size="100">💧</text></svg>',
      tag: 'hourly-reminder'
    });
  }
}