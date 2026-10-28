const CACHE = 'ohmoon-survival-v1';
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const SHELL = [
  '/', '/live/', '/launch/', '/how/',
  '/survival.css', '/survival.js', '/assets/ohmoon-logo-transparent.png'
].map(path => `${BASE}${path}`);
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); } return response; }).catch(() => caches.match(event.request).then(hit => hit || (event.request.mode === 'navigate' ? caches.match(`${BASE}/`) : Response.error()))));
});
