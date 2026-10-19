// Simple service worker: network first, fall back to cache when offline
const CACHE_NAME = 'mt-v1';

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Save a copy for offline use
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
