/* =====================================================================
   FILE: js/views/EventsView.js
   ОПТИМИЗАЦИЯ: Логика отделена от HTML. Использование EventsTemplate.
===================================================================== */
import { ApiService } from '../services/api.js';
import { EventsTemplate } from '../templates/EventsTemplate.js';

export class EventsView {
    constructor(container) {
        this.container = container;
    }

    async mount() {
        // Показываем скелетон перед загрузкой данных
        this.container.innerHTML = EventsTemplate.renderSkeletons();
        
        try {
            const events = await ApiService.getEvents();
            
            if (!events || events.length === 0) {
                this.container.innerHTML = EventsTemplate.renderEmpty();
                return;
            }

            // Рендерим готовый список через шаблон
            this.container.innerHTML = EventsTemplate.renderList(events);

        } catch (error) {
            console.error('[EventsView] Ошибка загрузки ивентов:', error);
            this.container.innerHTML = EventsTemplate.renderError();
        }
    }

    unmount() {
        // Заглушка на случай, если в будущем появятся слушатели событий
    }
}