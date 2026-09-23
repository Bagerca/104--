/* =====================================================================
   FILE: js/app.js
   ОПТИМИЗАЦИЯ: Добавлен перехватчик секретных ссылок (NFC Admin)
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        // --- 0. СЕКРЕТНАЯ ССЫЛКА ДЛЯ NFC (Временный Админ) ---
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'dev') {
            PrefsManager.enableTempAdmin();
            // Незаметно стираем ?auth=dev из адресной строки, чтобы друг ничего не понял
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
            window.history.replaceState(null, '', cleanUrl);
        }

        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        // --- 1. РЕГИСТРАЦИЯ SERVICE WORKER ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('[SW] Зарегистрирован:', reg.scope);
                    
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                if (confirm('Доступна новая версия приложения! Обновить сейчас?')) {
                                    window.location.reload();
                                }
                            }
                        });
                    });
                })
                .catch(err => console.warn('[SW] Ошибка:', err));

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }

        // --- 2. ЗАПУСК РОУТЕРА ---
        const router = new Router();
        router.init();

        // --- 3. ИНДИКАТОР ОФЛАЙНА ---
        window.addEventListener('offline', () => {
            Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000);
        });
        window.addEventListener('online', () => {
            Toast.show('Соединение восстановлено', 'success', 3000);
        });
        
        setTimeout(() => {
            if (!navigator.onLine) {
                Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000);
            }
        }, 1500);

    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});