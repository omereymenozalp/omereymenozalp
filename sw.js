// Süper Bıyık service worker: keeps the game playable offline when hosted as a static site.
// Bump VERSION when the shell file list changes; index.html itself is refreshed from the network on every visit.
const VERSION = 'v1';
const CACHE = 'super-biyik-' + VERSION;
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-48.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('super-biyik-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(key, res) {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  if (isPage) {
    // network-first so a new build shows up on the next visit; fall back to the cached page offline
    e.respondWith(
      fetch(req)
        .then(res => putInCache('index.html', res))
        .catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // cache-first for the static shell (manifest, icons), filling the cache on first fetch
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => putInCache(req, res))));
});
