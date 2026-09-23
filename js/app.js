/* =====================================================================
   FILE: js/app.js
   ОПТИМИЗАЦИЯ: Добавлен контроль сети (Offline) и АВТО-ОБНОВЛЕНИЕ PWA
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        // --- 1. РЕГИСТРАЦИЯ SERVICE WORKER И ПРОВЕРКА ОБНОВЛЕНИЙ ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('[SW] Зарегистрирован:', reg.scope);
                    
                    // Слушаем процесс скачивания обновления
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            // Если новая версия скачалась и готова к работе
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Спрашиваем пользователя
                                if (confirm('Доступна новая версия приложения! Обновить сейчас?')) {
                                    window.location.reload();
                                }
                            }
                        });
                    });
                })
                .catch(err => console.warn('[SW] Ошибка:', err));

            // Защита от бесконечного цикла перезагрузок
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }

        // --- 2. ИНДИКАТОР ОФЛАЙНА ---
        window.addEventListener('offline', () => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000));
        window.addEventListener('online', () => Toast.show('Соединение восстановлено', 'success', 3000));
        if (!navigator.onLine) {
            setTimeout(() => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000), 1000);
        }

        // --- 3. ЭФФЕКТ EDGE-TO-EDGE ДЛЯ ШАПКИ ---
        const header = document.querySelector('.app-header');
        window.addEventListener('scroll', () => {
            if (!header) return;
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });

        // --- 4. ЗАПУСК РОУТЕРА ---
        const router = new Router();
        router.init();
    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});