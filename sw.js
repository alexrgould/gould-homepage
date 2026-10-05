const CACHE_NAME = 'meal-planner-v65';
const ASSETS = [
  './index.html',
  './manifest.json',
  './app.css',
  './app.js',
  './kitchen.html',
  './kitchen-manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    // cache: 'reload' skips the browser's HTTP cache so a new version never stores stale files
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET — let POSTs (Claude proxy, etc.) go straight to the network
  if (event.request.method !== 'GET') return;

  // Fonts: cache-first so the serif renders instantly and works offline
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }))
    );
    return;
  }

  // Don't cache Firebase or external API calls
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('workers.dev') ||
      url.hostname.includes('allorigins')) {
    return;
  }

  // Our own files: revalidate with GitHub Pages every time (a cheap 304 when
  // unchanged) instead of trusting its 10-minute HTTP cache, so updates show on next open
  const req = url.origin === self.location.origin
    ? new Request(event.request, { cache: 'no-cache' }) // keeps redirect handling for page loads
    : event.request;
  event.respondWith(
    fetch(req)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || Response.error()))
  );
});
