const STATIC_CACHE = "expresskart-static-v3";
const DYNAMIC_CACHE = "expresskart-dynamic-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // add more static assets you want cached at install time (css, fonts, images)
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Helper: limit cache size (optional)
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// Fetch: Cache-first for static, network-first for API / dynamic
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore browser devtools or non-GET
  if (request.method !== "GET") return;

  // For navigation requests (page navigation)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // put a copy into dynamic cache
          const copy = res.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For other requests: try cache, then network, fallback to offline
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          // only cache same-origin requests (avoid caching CDN 3rd party)
          if (url.origin === location.origin) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
              // optional: trim cache to 50 items
              trimCache(DYNAMIC_CACHE, 50);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // if request is for image, return a generic placeholder (optional)
          if (request.destination === "image") {
            return caches.match("/icons/icon-192.png");
          }
          return caches.match(OFFLINE_URL);
        });
    })
  );
});

// Listen for skipWaiting message (for updates)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
