/* =====================================================================
   FILE: js/router.js
===================================================================== */
import { ScheduleView } from './views/ScheduleView.js';
import { GroupView } from './views/GroupView.js';
import { HomeworkView } from './views/HomeworkView.js';
import { EventsView } from './views/EventsView.js';
import { SettingsView } from './views/SettingsView.js';
import { PrefsManager } from './utils/prefs.js';

export class Router {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
        this.navItems = document.querySelectorAll('.nav-item');
        
        this.views = {
            '/schedule': new ScheduleView(this.contentContainer),
            '/group': new GroupView(this.contentContainer),
            '/homework': new HomeworkView(this.contentContainer),
            '/events': new EventsView(this.contentContainer),
            '/settings': new SettingsView(this.contentContainer)
        };
        
        this.currentView = null;
        this.renderId = 0; 

        // ИСПРАВЛЕНИЕ: Глобальное делегирование кликов для всех навигационных ссылок
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[href^="#/"]');
            if (navLink) {
                PrefsManager.vibrate(15);
            }
        });

        window.addEventListener('hashchange', this.handleRoute.bind(this));
    }

    init() {
        if (!window.location.hash) {
            const firstPage = PrefsManager.getPrefs().navOrder[0] || 'schedule';
            window.location.hash = '#/' + firstPage;
        } else {
            this.handleRoute();
        }
    }

    async handleRoute() {
        const path = window.location.hash.slice(1);
        const view = this.views[path];

        const currentRenderId = ++this.renderId;

        try {
            // ИСПРАВЛЕНИЕ: Мягкое скрытие через инлайн-стили без конфликта с классами
            this.contentContainer.classList.remove('fade-in');
            this.contentContainer.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
            this.contentContainer.style.opacity = '0';
            this.contentContainer.style.transform = 'translateY(10px)';

            await new Promise(res => setTimeout(res, 150));

            if (this.renderId !== currentRenderId) return;

            if (this.currentView) {
                this.currentView.unmount();
            }

            if (view) {
                this.currentView = view;
                this.updateNavUI(path);
                
                await view.mount();

                if (this.renderId !== currentRenderId) return;
            } else {
                const firstPage = PrefsManager.getPrefs().navOrder[0] || 'schedule';
                window.location.hash = '#/' + firstPage;
                return;
            }
            
            // ИСПРАВЛЕНИЕ: Полностью сбрасываем инлайн-стили, отдавая контроль CSS классу fade-in
            this.contentContainer.style.transition = '';
            this.contentContainer.style.opacity = '';
            this.contentContainer.style.transform = '';
            
            // Форсируем перерисовку DOM (Reflow), чтобы браузер "забыл" старые стили
            void this.contentContainer.offsetWidth;
            
            this.contentContainer.classList.add('fade-in');

        } catch (error) {
            console.error(`[Router Error] Ошибка перехода на ${path}:`, error);
            this.contentContainer.style.transition = '';
            this.contentContainer.style.opacity = '';
            this.contentContainer.style.transform = '';
        }
    }

    updateNavUI(currentPath) {
        this.navItems.forEach(item => {
            if (item.getAttribute('href').slice(1) === currentPath) {
                item.classList.add('active');
                this.pageTitle.textContent = item.getAttribute('data-title');
            } else {
                item.classList.remove('active');
            }
        });

        if (currentPath === '/settings') {
            this.pageTitle.textContent = 'Настройки';
        }
    }
}