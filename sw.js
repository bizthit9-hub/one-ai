const CACHE_NAME = "one-ai-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/app.css",
  "/assets/app.js",
  "/assets/launchericon-48x48.png",
  "/assets/launchericon-72x72.png",
  "/assets/launchericon-96x96.png",
  "/assets/launchericon-144x144.png",
  "/assets/launchericon-192x192.png",
  "/assets/launchericon-512x512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
