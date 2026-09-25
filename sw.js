/* =====================================================================
   FILE: sw.js
   ОПТИМИЗАЦИЯ: Добавлены все недостающие модули для 100% Offline режима
===================================================================== */
const CACHE_NAME = 'student-hub-v15'; // Версия поднята для обновы кэша

const ASSETS = [
    './',
    './index.html',
    './css/variables.css',
    './css/style.css',
    './css/components.css',
    './css/views/schedule.css',
    './css/views/group.css',
    './css/views/homework.css',
    './css/views/events.css',
    './css/views/settings.css',
    
    // Core JS
    './js/app.js',
    './js/router.js',
    './js/services/api.js',
    './js/utils/theme.js',
    './js/utils/prefs.js',
    './js/utils/time.js',
    './js/utils/ui.js',
    
    // Components
    './js/components/Lightbox.js',
    './js/components/Modal.js',
    './js/components/Toast.js',
    
    // Templates
    './js/templates/EventsTemplate.js',
    './js/templates/GroupTemplate.js',
    './js/templates/HomeworkTemplate.js',
    './js/templates/SettingsTemplate.js',
    
    // Views
    './js/views/EventsView.js',
    './js/views/GroupView.js',
    './js/views/HomeworkView.js',
    './js/views/ScheduleView.js',
    './js/views/SettingsView.js',
    
    // Assets
    './icons/icon.svg',
    './icons/icon-mobile.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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

    if (!url.origin.startsWith(self.location.origin) || url.protocol === 'chrome-extension:') {
        return;
    }

    if (url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request)) 
        );
        return;
    }

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
        }).catch(() => {})
    );
});