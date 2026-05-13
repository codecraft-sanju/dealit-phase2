// Listen for push events from the server
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    // Customize how the notification looks
    const options = {
      body: data.message,
      // You should add a 192x192 logo image in your public folder and name it logo192.png
      icon: '/logo192.png', 
      badge: '/logo192.png', // Small icon for the status bar
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/' // Backend will send which URL to open on click
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); 

  // Open the app or focus the existing open tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a tab is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
     
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});