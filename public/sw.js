const VERSION = "v1";
const SHELL_CACHE = `play-learn-shell-${VERSION}`;
const STATIC_CACHE = `play-learn-static-${VERSION}`;
const RUNTIME_CACHE = `play-learn-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icon-192.svg", "/icon-512.svg", "/apple-touch-icon.svg", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && new URL(request.url).pathname !== "/grown-ups") {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationFirst(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-") || url.pathname === "/apple-touch-icon.svg" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});
