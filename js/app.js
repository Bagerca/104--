/* =====================================================================
   FILE: js/app.js
   ОПТИМИЗАЦИЯ: Добавлен контроль сети (Offline Indicator)
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .catch(err => console.warn('[SW] Ошибка:', err));
        }

        // Контроль сети
        window.addEventListener('offline', () => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000));
        window.addEventListener('online', () => Toast.show('Соединение восстановлено', 'success', 3000));
        if (!navigator.onLine) {
            setTimeout(() => Toast.show('Офлайн режим. Показаны сохраненные данные.', 'offline', 5000), 1000);
        }

        const router = new Router();
        router.init();
    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});