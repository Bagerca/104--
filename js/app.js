/* =====================================================================
   FILE: js/app.js
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js';
import { ApiService } from './services/api.js';
import { NotificationService } from './services/NotificationService.js';
import { Store } from './store.js';
import { getIcon } from './utils/icons.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        // Внедряем иконку настроек
        const settingsBtn = document.getElementById('header-settings-btn');
        if (settingsBtn) {
            settingsBtn.innerHTML = getIcon('settings', { size: 24 });
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'dev') {
            PrefsManager.enableTempAdmin();
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
            window.history.replaceState(null, '', cleanUrl);
        }

        Store.init({
            prefs: PrefsManager.getPrefs()
        });

        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('[SW] Зарегистрирован:', reg.scope);
                
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('Доступна новая версия приложения! Обновить сейчас?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        }
                    });
                });
            }).catch(err => console.warn('[SW] Ошибка:', err));

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }

        const router = new Router();
        window.appRouter = router; 
        router.init();
        
        NotificationService.init();

        window.addEventListener('offline', () => {
            Store.setState({ isOffline: true });
            Toast.show('Нет интернета. Показаны сохраненные данные.', 'offline', 0);
        });
        
        window.addEventListener('online', () => {
            Store.setState({ isOffline: false });
            Toast.hide(); 
            setTimeout(() => {
                Toast.show('Соединение восстановлено', 'success', 3000);
            }, 300); 
        });
        
        setTimeout(() => {
            if (!navigator.onLine) {
                Store.setState({ isOffline: true });
                Toast.show('Нет интернета. Показаны сохраненные данные.', 'offline', 0);
            }
        }, 1500);

        initPullToRefresh();

    } catch (error) {
        console.error('[App Error] Критическая ошибка:', error);
    }
});

function initPullToRefresh() {
    let ptrStartY = 0;
    let ptrCurrentY = 0;
    let isPtrActive = false;
    let ptrEl = null;

    document.addEventListener('touchstart', (e) => {
        if (document.querySelector('dialog[open]')) return;

        const isHorizontalScroll = e.target.closest('.theme-scroll-wrapper, .days-wrapper');
        if (isHorizontalScroll) return;

        if (window.scrollY === 0) {
            ptrStartY = e.touches[0].clientY;
            isPtrActive = true;
            if (!ptrEl) {
                ptrEl = document.createElement('div');
                ptrEl.id = 'ptr-indicator';
                ptrEl.innerHTML = getIcon('refresh-spinner', { size: 24 });
                document.body.appendChild(ptrEl);
            }
        }
    }, {passive: true});

    document.addEventListener('touchmove', (e) => {
        if (!isPtrActive || !ptrEl) return;
        ptrCurrentY = e.touches[0].clientY;
        const diff = ptrCurrentY - ptrStartY;
        
        if (diff > 0 && window.scrollY === 0) {
            const pull = Math.min(diff * 0.4, 60);
            ptrEl.style.transform = `translateY(${pull}px) rotate(${pull * 3}deg)`;
            ptrEl.style.opacity = Math.min(pull / 60, 1);
        }
    }, {passive: true});

    document.addEventListener('touchend', async () => {
        if (!isPtrActive || !ptrEl) return;
        isPtrActive = false;
        const diff = ptrCurrentY - ptrStartY;
        
        if (diff > 120 && window.scrollY === 0) {
            PrefsManager.vibrate(20);
            ptrEl.classList.add('refreshing');
            ptrEl.style.transform = `translateY(50px) rotate(360deg)`;
            
            ApiService.clearCache();
            if (window.appRouter) await window.appRouter.handleRoute(true);
            
            ptrEl.classList.remove('refreshing');
            ptrEl.style.transform = `translateY(-50px)`;
            ptrEl.style.opacity = '0';
        } else {
            ptrEl.style.transform = `translateY(-50px)`;
            ptrEl.style.opacity = '0';
        }
    }, {passive: true});
}