/* =====================================================================
   FILE: js/router.js
===================================================================== */
import { ScheduleView } from './views/ScheduleView.js';
import { GroupView } from './views/GroupView.js';
import { HomeworkView } from './views/HomeworkView.js';
import { EventsView } from './views/EventsView.js';

export class Router {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
        this.navItems = document.querySelectorAll('.nav-item');
        
        // Инициализация Views
        this.views = {
            '/schedule': new ScheduleView(this.contentContainer),
            '/group': new GroupView(this.contentContainer),
            '/homework': new HomeworkView(this.contentContainer),
            '/events': new EventsView(this.contentContainer)
        };
        
        this.currentView = null;
        window.addEventListener('hashchange', this.handleRoute.bind(this));
    }

    init() {
        if (!window.location.hash) window.location.hash = '#/schedule';
        else this.handleRoute();
    }

    async handleRoute() {
        const path = window.location.hash.slice(1);
        const view = this.views[path];

        try {
            this.contentContainer.classList.remove('fade-in');
            
            // Ждем завершения CSS анимации
            await new Promise(res => setTimeout(res, 100));

            if (this.currentView) {
                this.currentView.unmount(); // Очистка таймеров и событий старой View
            }

            if (view) {
                this.currentView = view;
                await view.mount(); // Рендер новой View
                this.updateNavUI(path);
            } else {
                window.location.hash = '#/schedule';
            }
            
            this.contentContainer.classList.add('fade-in');
        } catch (error) {
            console.error(`[Router Error] Ошибка перехода на ${path}:`, error);
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
    }
}