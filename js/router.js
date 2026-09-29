/* =====================================================================
   FILE: js/router.js
===================================================================== */
import { ScheduleView } from './views/ScheduleView.js';
import { GroupView } from './views/GroupView.js';
import { HomeworkView } from './views/HomeworkView.js';
import { EventsView } from './views/EventsView.js';
import { SettingsView } from './views/SettingsView.js';
import { GamesView } from './views/GamesView.js';
import { SnakeView } from './views/SnakeView.js';
import { Game2048View } from './views/2048View.js';
import { FlappyView } from './views/FlappyView.js';
import { PrefsManager } from './utils/prefs.js';
import { Store } from './store.js';
import { Lightbox } from './components/Lightbox.js';
import { Modal } from './components/Modal.js';

export class Router {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
        
        this.views = {
            '/schedule': new ScheduleView(this.contentContainer),
            '/group': new GroupView(this.contentContainer),
            '/homework': new HomeworkView(this.contentContainer),
            '/events': new EventsView(this.contentContainer),
            '/settings': new SettingsView(this.contentContainer),
            '/games': new GamesView(this.contentContainer),
            '/games/snake': new SnakeView(this.contentContainer),
            '/games/2048': new Game2048View(this.contentContainer),
            '/games/flappy': new FlappyView(this.contentContainer)
        };
        
        this.currentViewName = null;
        this.currentView = null;
        this.renderId = 0; 

        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[href^="#/"]');
            if (navLink) PrefsManager.vibrate(15);
        });

        window.addEventListener('hashchange', () => this.handleRoute());
    }

    init() {
        if (!window.location.hash || window.location.hash === '#/') {
            const firstPage = Store.getState().prefs.navOrder?.[0] || 'schedule';
            window.location.replace('#/' + firstPage);
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
        const view = this.views[path];
        const currentRenderId = ++this.renderId;

        // --- Управление Fullscreen Режимом для Игр ---
        if (path.startsWith('/games/') && path !== '/games') {
            document.body.classList.add('game-mode-active');
        } else {
            document.body.classList.remove('game-mode-active');
        }

        // --- Глобальные модалки ---
        if (params.lightbox) Lightbox.render(decodeURIComponent(params.lightbox));
        else Lightbox.hide();

        if (params.alert) Modal.render();
        else Modal.hide();
        // --------------------------

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

            if (view) {
                this.currentViewName = path;
                this.currentView = view;
                this.updateNavUI(path);
                await view.mount(params);
                if (this.renderId !== currentRenderId) return;
            } else {
                const firstPage = Store.getState().prefs.navOrder?.[0] || 'schedule';
                window.location.replace('#/' + firstPage);
                return;
            }
            
            this.contentContainer.style.transition = '';
            this.contentContainer.style.opacity = '';
            this.contentContainer.style.transform = '';
            void this.contentContainer.offsetWidth;
            this.contentContainer.classList.add('fade-in');

        } catch (error) {
            console.error(`[Router Error] Ошибка перехода на ${path}:`, error);
        }
    }

    updateNavUI(currentPath) {
        const baseRoute = currentPath.split('/')[1];
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            const itemPath = item.getAttribute('href').slice(2).split('?')[0]; 
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