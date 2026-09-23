/* =====================================================================
   FILE: js/app.js
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); // Применяем обои и энергосбережение
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('[ServiceWorker] Зарегистрирован:', reg.scope))
                .catch(err => console.warn('[ServiceWorker] Ошибка регистрации:', err));
        }

        const router = new Router();
        router.init();
    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});