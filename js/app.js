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

function renderBottomNav() {
    const navEl = document.getElementById('bottom-nav');
    if (!navEl) return;
    
    const prefs = Store.getState().prefs;
    const navOrder = prefs.navOrder || ['schedule', 'homework', 'group', 'events', 'games'];
    const themeId = Store.getState().currentTheme;
    const isSeasonal = themeId === 'halloween' || themeId === 'new-year';

    const navMap = {
        'schedule': { title: 'Уроки', icon: 'schedule' },
        'homework': { title: 'ДЗ', icon: 'homework' },
        'group': { title: 'Группа', icon: 'group' },
        'events': { title: 'Ивенты', icon: 'events' },
        'games': { title: 'Игры', icon: 'games' }
    };

    navEl.innerHTML = navOrder.filter(id => navMap[id]).map(id => {
        const iconKey = isSeasonal ? `nav-${id}-${themeId}` : `nav-${id}`;
        return `
            <a href="#/${id}" class="nav-item" data-icon="${id}" data-title="${navMap[id].title}">
                ${getIcon(iconKey, { size: 24 })}
                <span>${navMap[id].title}</span>
            </a>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const settingsBtn = document.getElementById('header-settings-btn');
        if (settingsBtn) settingsBtn.innerHTML = getIcon('settings', { size: 24 });

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'dev') {
            PrefsManager.enableTempAdmin();
            window.history.replaceState(null, '', window.location.href.split('?')[0]);
        }

        Store.init({ prefs: PrefsManager.getPrefs() });
        ThemeManager.init();
        PrefsManager.applySettingsToDOM(); 
        
        renderBottomNav();
        Store.subscribe((state, key) => {
            if (key === 'currentTheme' || key === 'pref_navOrder' || key === 'all') {
                renderBottomNav();
                if (window.appRouter) window.appRouter.updateNavUI(window.location.hash.slice(1).split('?')[0] || `/${state.prefs.navOrder[0]}`);
            }
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('Доступна новая версия! Обновить?')) newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            }).catch(e => console.warn('[SW] Ошибка:', e));

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) { refreshing = true; window.location.reload(); }
            });
        }

        const router = new Router();
        window.appRouter = router; 
        router.init();
        NotificationService.init();

        window.addEventListener('offline', () => { Store.setState({ isOffline: true }); Toast.show('Нет интернета.', 'offline', 0); });
        window.addEventListener('online', () => { Store.setState({ isOffline: false }); Toast.hide(); Toast.show('Соединение восстановлено', 'success', 3000); });
        setTimeout(() => { if (!navigator.onLine) { Store.setState({ isOffline: true }); Toast.show('Нет интернета.', 'offline', 0); } }, 1500);
        initPullToRefresh();
    } catch (error) {
        console.error('[App] Критическая ошибка:', error);
    }
});

function initPullToRefresh() {
    let ptrStartY = 0, ptrCurrentY = 0, isPtrActive = false, ptrEl = null;
    
    document.addEventListener('touchstart', (e) => {
        // ФИКС: Если мы тапаем внутри игровых зон, модалок или горизонтальных скроллов - игнорируем кастомный PTR
        if (document.querySelector('dialog[open]') || 
            e.target.closest('.theme-scroll-wrapper, .days-wrapper, .snake-game-area, .g2048-game-area, .flappy-game-area')) {
            return;
        }
        
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
        if (ptrCurrentY - ptrStartY > 120 && window.scrollY === 0) {
            PrefsManager.vibrate(20);
            ptrEl.classList.add('refreshing'); ptrEl.style.transform = `translateY(50px) rotate(360deg)`;
            ApiService.clearCache();
            if (window.appRouter) await window.appRouter.handleRoute(true);
            ptrEl.classList.remove('refreshing'); ptrEl.style.transform = `translateY(-50px)`; ptrEl.style.opacity = '0';
        } else {
            ptrEl.style.transform = `translateY(-50px)`; ptrEl.style.opacity = '0';
        }
    }, {passive: true});
}