/* =========================================================
   NOTMATİK - Service Worker (Çevrimdışı PWA Desteği)
   ========================================================= */

const CACHE_NAME = 'notmatik-v3.1.0';
const APP_SHELL = [
    './',
    './index.html',
    './not-defteri.html',
    './offline.html',
    './manifest.webmanifest',
    './opensearch.xml',
    './favicon.ico',
    './assets/css/main.css',
    './assets/css/calculator.css',
    './assets/css/notebook.css',
    './assets/js/common.js',
    './assets/js/calculator.js',
    './assets/js/notebook.js',
    './assets/img/logo.png',
    './assets/img/icon-192.png',
    './assets/img/icon-512.png',
    './assets/img/icon-maskable-512.png',
    './assets/img/apple-touch-icon.png',
    './assets/img/favicon-32.png',
    './assets/img/favicon-16.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('./index.html') || caches.match('./offline.html');
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});
