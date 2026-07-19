// Service Worker para Web Push Notifications
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Appbello', body: event.data ? event.data.text() : 'Nova notificação' };
  }

  const title = data.title || 'Appbello';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: data.tag || 'appbello',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/dashboard/agenda' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard/agenda';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
