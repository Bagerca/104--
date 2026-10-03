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
import { MinesweeperView } from './views/MinesweeperView.js';
import { TicTacToeView } from './views/TicTacToeView.js';
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
            '/games/flappy': new FlappyView(this.contentContainer),
            '/games/minesweeper': new MinesweeperView(this.contentContainer),
            '/games/tictactoe': new TicTacToeView(this.contentContainer)
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

    getDefaultRoute() {
        const navOrder = Store.getState().prefs.navOrder || ['schedule', 'homework', 'group', 'events', 'games'];
        const allowedNav = navOrder.filter(id => id !== 'homework');
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

        // Защита от прямого перехода в заблокированный раздел ДЗ
        if (path === '/homework') {
            console.warn('[Router] Доступ к разделу ДЗ временно заблокирован.');
            window.location.replace('#/' + this.getDefaultRoute());
            return;
        }

        const view = this.views[path];
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