/* =====================================================================
   FILE: sw.js
   ОПТИМИЗАЦИЯ: Раздельные стратегии кэширования и защита от чужого origin
===================================================================== */
const CACHE_NAME = 'student-hub-v11'; // Версия поднята из-за изменения стратегий

const ASSETS = [
    './',
    './index.html',
    './css/variables.css',
    './css/style.css',
    './css/views/schedule.css',
    './css/views/group.css',
    './css/views/homework.css',
    './css/views/events.css',
    './css/views/settings.css',
    './js/app.js',
    './js/router.js',
    './js/utils/theme.js',
    './js/utils/prefs.js',
    './js/utils/time.js',
    './js/services/api.js',
    './js/views/SettingsView.js',
    './icons/icon.svg',
    './icons/icon-mobile.svg'
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
    const url = new URL(event.request.url);

    // 1. Пропускаем сторонние запросы (CORS, расширения, аналитика)
    if (!url.origin.startsWith(self.location.origin) || url.protocol === 'chrome-extension:') {
        return;
    }

    // 2. Стратегия Network First для JSON-данных (Расписание, ДЗ должны быть свежими)
    if (url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request)) // Офлайн фоллбэк
        );
        return;
    }

    // 3. Стратегия Cache First для статики (CSS, JS, Картинки)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            });
        }).catch(() => {
            // Опционально: вернуть заглушку, если картинки нет
        })
    );
});