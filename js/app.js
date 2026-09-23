/* =====================================================================
   FILE: js/app.js
   ОПТИМИЗАЦИЯ: Добавлен контроль сети (Offline Indicator) и Edge-to-Edge Scroll
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js'; // Убедись, что создал Toast.js из прошлого ответа

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('[SW] Зарегистрирован:', reg.scope))
                .catch(err => console.warn('[SW] Ошибка:', err));
        }

        // Контроль сети
        window.addEventListener('offline', () => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000));
        window.addEventListener('online', () => Toast.show('Соединение восстановлено', 'success', 3000));
        if (!navigator.onLine) {
            setTimeout(() => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000), 1000);
        }

        // Эффект "Telegram" для шапки (Edge-to-Edge)
        const header = document.querySelector('.app-header');
        window.addEventListener('scroll', () => {
            if (!header) return;
            // Если скроллим больше чем на 10px вниз - включаем фон-стекло
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });

        const router = new Router();
        router.init();
    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});