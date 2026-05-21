// Listen for push events from the server
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
  
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

  // Backend se aane wale relative URL ko Absolute URL mein convert karna
  const targetUrl = event.notification.data.url || '/';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  // Open the app or focus the existing open tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      
      // Case 1: Agar EXACT same URL wala tab pehle se open hai, toh usko focus karo
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Case 2: Agar app khuli hui hai par dusre page par hai, toh wahi tab focus karke redirect kar do
      if (clientList.length > 0) {
        const client = clientList[0];
        if ('focus' in client) client.focus();
        if ('navigate' in client) return client.navigate(urlToOpen); // Yeh duplicate tabs banne se rokega
      }

      // Case 3: Agar app browser me completely band hai, toh naya tab open karo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});