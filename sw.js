const CACHE_NAME = "rundenkampf-v1";
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
