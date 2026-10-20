// Service worker: precache the app, then network first with cache fallback
const CACHE_NAME = 'mt-v3';

// Every file the app needs to run offline
const APP_FILES = [
    './',
    'index.html',
    'manifest.json',
    'shared/base.css',
    'shared/store.js',
    'shared/nav.js',
    'onboarding/onboarding.html',
    'onboarding/onboarding.css',
    'onboarding/onboarding.js',
    'home/home.html',
    'home/home.css',
    'home/home.js',
    'transactions/transactions.html',
    'transactions/transactions.css',
    'transactions/transactions.js',
    'budget/budget.html',
    'budget/budget.css',
    'budget/budget.js',
    'reports/reports.html',
    'reports/reports.css',
    'reports/reports.js',
    'settings/settings.html',
    'settings/settings.css',
    'settings/settings.js',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable-512.png',
    'icons/apple-touch-icon.png'
];


// ---------- Install: download every app file into the cache ----------
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});


// ---------- Activate: remove old caches when the version changes ----------
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names
                    .filter(function (name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        })
    );

    self.clients.claim();
});


// ---------- Fetch: network first, cache as the offline fallback ----------
self.addEventListener('fetch', function (event) {
    const request = event.request;

    // Only handle normal GET requests to http(s) URLs.
    // This skips chrome-extension:// and other schemes the Cache API rejects.
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(function (response) {
                // Only keep good responses from our own site
                const sameOrigin = new URL(request.url).origin === self.location.origin;

                if (response.ok && sameOrigin) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function (cache) {
                            return cache.put(request, copy);
                        })
                        .catch(function () {
                            // Ignore: caching is a bonus, not required
                        });
                }

                return response;
            })
            .catch(function () {
                // Offline: fall back to the cached copy
                return caches.match(request);
            })
    );
});