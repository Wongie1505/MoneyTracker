// Precache the app, then use the network first and fall back to the cache offline.
// Change CACHE when you update files so old copies are removed.
const CACHE = 'money-tracker-v5';

const FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png'
];

// Save every app file on install
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) {
                return cache.addAll(FILES);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

// Delete caches from older versions
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) { return key !== CACHE; })
                        .map(function (key) { return caches.delete(key); })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

// Network first so updates show up, cache when offline
self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    // Only handle GET requests for this app's own files.
    // This skips browser extensions (chrome-extension://) and other sites.
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Only keep good responses
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE).then(function (cache) {
                        return cache.put(event.request, copy);
                    }).catch(function () {
                        // Could not cache this request, ignore it
                    });
                }

                return response;
            })
            .catch(function () {
                return caches.match(event.request).then(function (cached) {
                    return cached || caches.match('./index.html');
                });
            })
    );
});