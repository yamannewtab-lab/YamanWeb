// service-worker.js

self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push received:', data);
  const options = {
    body: data.body,
    // You can add an icon here, e.g., icon: '/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  // This focuses the client window if it's already open.
  // Otherwise, it opens a new one.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
