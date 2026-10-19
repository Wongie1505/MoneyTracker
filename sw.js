// Service worker: precache the app, then network first with cache fallback
const CACHE_NAME = 'mt-v2';

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

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

// Remove old caches when the version changes
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names
                    .filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) { return caches.delete(name); })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Keep a fresh copy for offline use
                var copy = response.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, copy);
                });

                return response;
            })
            .catch(function () {
                return caches.match(event.request);
            })
    );
});
