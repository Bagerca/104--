/* =====================================================================
   FILE: js/router.js
   ОПТИМИЗАЦИЯ: Внедрен RenderID (защита от Race Condition) и виброотклик
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
        
        // Уникальный ID для каждого перехода (Защита от спама кликами)
        this.renderId = 0; 

        // Добавляем тактильный отклик на все ссылки навигации и настройки
        document.querySelectorAll('a[href^="#/"]').forEach(link => {
            link.addEventListener('click', () => PrefsManager.vibrate(15));
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

        // 1. Увеличиваем ID рендера (все старые процессы станут неактуальными)
        const currentRenderId = ++this.renderId;

        try {
            // 2. Скрываем старый контент
            this.contentContainer.classList.remove('fade-in');
            this.contentContainer.style.opacity = '0';
            this.contentContainer.style.transform = 'translateY(10px)';

            // Ждем завершения анимации исчезновения
            await new Promise(res => setTimeout(res, 150));

            // ВАЖНО: Если во время скрытия юзер нажал другую кнопку - прерываем этот процесс!
            if (this.renderId !== currentRenderId) return;

            // 3. Отмонтируем старую вьюху
            if (this.currentView) {
                this.currentView.unmount();
            }

            // 4. Монтируем новую вьюху
            if (view) {
                this.currentView = view;
                this.updateNavUI(path);
                
                // Ждем загрузки данных (fetch JSON)
                await view.mount();

                // ВАЖНО: Если данные грузились долго, а юзер уже ушел на другой экран - не показываем результат!
                if (this.renderId !== currentRenderId) return;
            } else {
                const firstPage = PrefsManager.getPrefs().navOrder[0] || 'schedule';
                window.location.hash = '#/' + firstPage;
                return;
            }
            
            // 5. Показываем новый контент
            this.contentContainer.style.transform = 'translateY(0)';
            this.contentContainer.style.opacity = '1';
            this.contentContainer.classList.add('fade-in');

        } catch (error) {
            console.error(`[Router Error] Ошибка перехода на ${path}:`, error);
            // Восстанавливаем видимость экрана в случае критической ошибки
            this.contentContainer.style.opacity = '1';
            this.contentContainer.style.transform = 'translateY(0)';
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