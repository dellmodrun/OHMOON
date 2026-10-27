const CACHE = 'onemod-shell-v6';
const SHELL = [
  '/onemod/', '/onemod/live/', '/onemod/calls/', '/onemod/burns/', '/onemod/launch/', '/onemod/how/', '/onemod/trade/',
  '/onemod/onemod.css', '/onemod/wallet.css', '/onemod/project-detail.css', '/onemod/onemod.js', '/onemod/wallet.js', '/onemod/live-data.js', '/onemod/project-detail.js',
  '/onemod/assets/onemod-logo-transparent.png', '/onemod/assets/onemod-favicon.png', '/onemod/assets/projects/token-placeholder.svg', '/onemod/vendor/solana-web3.min.js', '/onemod/vendor/wallet-standard.min.js'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/onemod/'))));
});
