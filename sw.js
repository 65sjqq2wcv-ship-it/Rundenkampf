// Erweiterte Service Worker Version für vollständige Offline-Funktionalität
const APP_VERSION = "1.78";
const CACHE_NAME = `rundenkampf-v${APP_VERSION}`;
const STATIC_CACHE = `rundenkampf-static-v${APP_VERSION}`;
const DYNAMIC_CACHE = `rundenkampf-dynamic-v${APP_VERSION}`;

// Statische Ressourcen die immer gecacht werden sollen
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./js/version.js",
  "./css/styles.css",
  "./css/pdf-styles.css",
  "./js/models.js",
  "./js/storage.js",
  "./js/utils.js",
  "./js/validation.js",
  "./js/app.js",
  "./js/views/overview-view.js",
  "./js/views/entry-view.js",
  "./js/views/teams-view.js",
  "./js/views/settings-view.js",
  "./js/pdf-exporter.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
];

// Externe CDN-Ressourcen
const CDN_ASSETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
];

// =================================================================
// INSTALLATION
// =================================================================

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    Promise.all([
      // Statische Ressourcen cachen
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),

      // CDN-Ressourcen cachen (mit Fehlerbehandlung)
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log("Service Worker: Caching CDN assets");
        return Promise.all(
          CDN_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`Failed to cache CDN asset: ${url}`, err);
              return Promise.resolve(); // Fortfahren auch wenn CDN nicht verfügbar
            }),
          ),
        );
      }),
    ])
      .then(() => {
        console.log("Service Worker: Installation completed");
        return self.skipWaiting(); // Sofort aktivieren
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed", error);
      }),
  );
});

// =================================================================
// AKTIVIERUNG
// =================================================================

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    Promise.all([
      // Alte Caches löschen
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),

      // Sofort alle Clients übernehmen
      self.clients.claim(),
    ]).then(() => {
      console.log("Service Worker: Activation completed");

      // Notification an alle Clients über Update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_UPDATED",
            message:
              "Service Worker aktualisiert - App ist jetzt offline verfügbar",
          });
        });
      });
    }),
  );
});

// =================================================================
// FETCH HANDLING - Erweiterte Offline-Strategie
// =================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Verschiedene Strategien für verschiedene Ressourcentypen
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isCDNAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// =================================================================
// CACHE-STRATEGIEN
// =================================================================

// Cache First - für statische Ressourcen
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn("Cache First failed:", error);

    // Fallback für verschiedene Ressourcentypen
    if (isNavigationRequest(request)) {
      return caches.match("./index.html");
    }

    // Für andere Ressourcen einen einfachen Offline-Response zurückgeben
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Network First - für dynamische Inhalte
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback für Navigation
    if (isNavigationRequest(request)) {
      return caches.match("./index.html");
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Stale While Revalidate - für CDN-Ressourcen
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Bei Netzwerkfehler nichts tun, cachedResponse wird zurückgegeben
      return null;
    });

  // Cached response sofort zurückgeben, Update im Hintergrund
  return (
    cachedResponse ||
    (await fetchPromise) ||
    new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    })
  );
}

// =================================================================
// HILFSFUNKTIONEN
// =================================================================

function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some((asset) => {
    const assetUrl = new URL(asset, self.location.origin);
    return url.pathname === assetUrl.pathname;
  });
}

function isCDNAsset(request) {
  const url = new URL(request.url);
  return (
    CDN_ASSETS.some((asset) => request.url.includes(asset)) ||
    url.hostname.includes("cdnjs.cloudflare.com")
  );
}

function isImageRequest(request) {
  return (
    request.destination === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url)
  );
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    request.destination === "document" ||
    (request.method === "GET" &&
      request.headers.get("accept").includes("text/html"))
  );
}

// =================================================================
// BACKGROUND SYNC (für zukünftige Erweiterungen)
// =================================================================

self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("Service Worker: Background sync triggered");
  // Hier könnte später Synchronisation implementiert werden
}

// =================================================================
// PUSH NOTIFICATIONS (für zukünftige Erweiterungen)
// =================================================================

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "./icons/icon-192x192.png",
      badge: "./icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// =================================================================
// MESSAGE HANDLING
// =================================================================

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({
      type: "VERSION_INFO",
      version: CACHE_NAME,
      cached: true,
    });
  }
});

// =================================================================
// CACHE MANAGEMENT
// =================================================================

// Cache-Größe begrenzen (für Bilder/dynamische Inhalte)
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}

// Periodische Cache-Bereinigung
setInterval(() => {
  limitCacheSize(DYNAMIC_CACHE, 50);
}, 60000); // Alle 60 Sekunden

console.log("Service Worker: Script loaded successfully");
