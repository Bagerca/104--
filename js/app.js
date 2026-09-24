/* =====================================================================
   FILE: js/app.js
===================================================================== */
import { Router } from './router.js';
import { ThemeManager } from './utils/theme.js';
import { PrefsManager } from './utils/prefs.js';
import { Toast } from './components/Toast.js';
import { ApiService } from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('[App] Инициализация приложения...');
        
        // --- 0. СЕКРЕТНАЯ ССЫЛКА ДЛЯ NFC ---
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'dev') {
            PrefsManager.enableTempAdmin();
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
            window.history.replaceState(null, '', cleanUrl);
        }

        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        // --- 1. РЕГИСТРАЦИЯ SERVICE WORKER (Надежное обновление) ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('[SW] Зарегистрирован:', reg.scope);
                
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        // Ждем, пока новый SW скачается и будет готов к активации
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('Доступна новая версия приложения! Обновить сейчас?')) {
                                // Отправляем команду на применение нового кэша
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        }
                    });
                });
            }).catch(err => console.warn('[SW] Ошибка:', err));

            // Как только старый SW сменится на новый — жестко перезагружаем страницу
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
        window.appRouter = router; 
        router.init();

        // --- 3. ИНДИКАТОР ОФЛАЙНА ---
        window.addEventListener('offline', () => {
            Toast.show('Нет интернета. Показаны сохраненные данные.', 'offline', 0);
        });
        
        window.addEventListener('online', () => {
            Toast.hide(); 
            setTimeout(() => {
                Toast.show('Соединение восстановлено', 'success', 3000);
            }, 300); 
        });
        
        setTimeout(() => {
            if (!navigator.onLine) {
                Toast.show('Нет интернета. Показаны сохраненные данные.', 'offline', 0);
            }
        }, 1500);

        // --- 4. ПАТТЕРН PULL TO REFRESH ---
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
        if (window.scrollY === 0) {
            ptrStartY = e.touches[0].clientY;
            isPtrActive = true;
            if (!ptrEl) {
                ptrEl = document.createElement('div');
                ptrEl.id = 'ptr-indicator';
                ptrEl.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
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
            if (window.appRouter) await window.appRouter.handleRoute();
            
            ptrEl.classList.remove('refreshing');
            ptrEl.style.transform = `translateY(-50px)`;
            ptrEl.style.opacity = '0';
        } else {
            ptrEl.style.transform = `translateY(-50px)`;
            ptrEl.style.opacity = '0';
        }
    }, {passive: true});
}