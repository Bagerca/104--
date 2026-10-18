/* =====================================================================
   FILE: js/router.js
==================================================================== */
import { PrefsManager } from './utils/prefs.js';
import { Store } from './store.js';
import { Lightbox } from './components/Lightbox.js';
import { Modal } from './components/Modal.js';

export class Router {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
        
        // PERFORMANCE BOOST: Динамические импорты (Code Splitting).
        // Скрипты экранов и игр скачиваются и компилируются только при первом заходе.
        this.viewLoaders = {
            '/schedule': () => import('./views/ScheduleView.js').then(m => m.ScheduleView),
            '/group': () => import('./views/GroupView.js').then(m => m.GroupView),
            '/homework': () => import('./views/HomeworkView.js').then(m => m.HomeworkView),
            '/events': () => import('./views/EventsView.js').then(m => m.EventsView),
            '/settings': () => import('./views/SettingsView.js').then(m => m.SettingsView),
            '/games': () => import('./views/GamesView.js').then(m => m.GamesView),
            '/games/snake': () => import('./views/SnakeView.js').then(m => m.SnakeView),
            '/games/2048': () => import('./views/2048View.js').then(m => m.Game2048View),
            '/games/flappy': () => import('./views/FlappyView.js').then(m => m.FlappyView),
            '/games/minesweeper': () => import('./views/MinesweeperView.js').then(m => m.MinesweeperView),
            '/games/tictactoe': () => import('./views/TicTacToeView.js').then(m => m.TicTacToeView)
        };
        
        // Кэш уже инициализированных экранов
        this.views = {};
        
        this.currentViewName = null;
        this.currentView = null;
        this.renderId = 0; 

        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[href^="#/"]');
            if (navLink) PrefsManager.vibrate(15);
        });

        window.addEventListener('hashchange', () => this.handleRoute());
    }

    getDefaultRoute() {
        const navOrder = Store.getState().prefs.navOrder || ['schedule', 'homework', 'group', 'events', 'games'];
        // РАЗБЛОКИРОВКА ДЛЯ АДМИНА: разрешаем стартовать с ДЗ, если мы админы
        const allowedNav = navOrder.filter(id => id !== 'homework' || PrefsManager.isAdmin());
        return allowedNav[0] || 'schedule';
    }

    init() {
        if (!window.location.hash || window.location.hash === '#/') {
            window.location.replace('#/' + this.getDefaultRoute());
        } else {
            this.handleRoute();
        }
    }

    parseHash() {
        const rawHash = window.location.hash.slice(1) || '/';
        const [path, queryString] = rawHash.split('?');
        const params = {};
        if (queryString) {
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams.entries()) params[key] = value;
        }
        return { path, params };
    }

    async handleRoute(forceReload = false) {
        const { path, params } = this.parseHash();

        // РАЗБЛОКИРОВКА ДЛЯ АДМИНА: пускаем в роут, если админ
        if (path === '/homework' && !PrefsManager.isAdmin()) {
            console.warn('[Router] Доступ к разделу ДЗ временно заблокирован.');
            window.location.replace('#/' + this.getDefaultRoute());
            return;
        }

        const currentRenderId = ++this.renderId;

        if (path.startsWith('/games/') && path !== '/games') {
            document.body.classList.add('game-mode-active');
        } else {
            document.body.classList.remove('game-mode-active');
        }

        if (params.lightbox) Lightbox.render(decodeURIComponent(params.lightbox));
        else Lightbox.hide();

        if (params.alert) Modal.render();
        else Modal.hide();

        try {
            if (!forceReload && this.currentViewName === path && this.currentView) {
                if (typeof this.currentView.update === 'function') {
                    await this.currentView.update(params);
                    return; 
                }
            }

            this.contentContainer.classList.remove('fade-in');
            this.contentContainer.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
            this.contentContainer.style.opacity = '0';
            this.contentContainer.style.transform = 'translateY(10px)';

            await new Promise(res => setTimeout(res, 150));
            if (this.renderId !== currentRenderId) return;

            if (this.currentView && typeof this.currentView.unmount === 'function') {
                this.currentView.unmount();
            }

            // Динамическая инициализация View из кэша или загрузка
            let view = this.views[path];
            if (!view && this.viewLoaders[path]) {
                const ViewClass = await this.viewLoaders[path]();
                view = new ViewClass(this.contentContainer);
                this.views[path] = view;
            }

            if (view) {
                this.currentViewName = path;
                this.currentView = view;
                this.updateNavUI(path);
                await view.mount(params);
                if (this.renderId !== currentRenderId) return;
            } else {
                window.location.replace('#/' + this.getDefaultRoute());
                return;
            }
            
            this.contentContainer.style.transition = '';
            this.contentContainer.style.opacity = '';
            this.contentContainer.style.transform = '';
            void this.contentContainer.offsetWidth;
            this.contentContainer.classList.add('fade-in');

        } catch (error) {
            console.error(`[Router Error] Ошибка перехода на ${path}:`, error);
            this.contentContainer.style.transition = '';
            this.contentContainer.style.opacity = '1';
            this.contentContainer.style.transform = 'none';
            this.contentContainer.innerHTML = `<div class="placeholder-card" style="text-align:center; color:#ff4d4d; margin-top: 20px;">Критическая ошибка экрана.<br>Проверьте консоль.</div>`;
        }
    }

    updateNavUI(currentPath) {
        const baseRoute = currentPath.split('/')[1];
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;
            const itemPath = href.slice(2).split('?')[0]; 
            if (itemPath === baseRoute) {
                item.classList.add('active');
                if (currentPath === '/settings') this.pageTitle.textContent = 'Настройки';
                else if (!currentPath.startsWith('/games/')) this.pageTitle.textContent = item.getAttribute('data-title');
            } else {
                item.classList.remove('active');
            }
        });
    }
}