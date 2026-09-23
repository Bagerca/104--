/* =====================================================================
   FILE: sw.js
===================================================================== */
const CACHE_NAME = 'student-hub-v3'; // Поменяли версию кэша на v3

const ASSETS = [
    './',
    './index.html',
    './css/variables.css',
    './css/style.css',
    './css/views/schedule.css',
    './css/views/group.css',
    './css/views/homework.css',
    './css/views/events.css',
    './js/app.js',
    './js/router.js',
    './data/bells.json',
    './data/schedule.json',
    './data/students.json',
    './data/teachers.json' // Добавили новый файл в кэш
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});