const CACHE_NAME = "rundenkampf-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/models.js",
  "./js/storage.js",
  "./js/utils.js",
  "./js/app.js",
  "./js/views/overview-view.js",
  "./js/views/entry-view.js",
  "./js/views/teams-view.js",
  "./js/views/settings-view.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => console.log('Cache erstellt'))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Lösche alten Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .catch(() => {
            // Offline-Fallback
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});