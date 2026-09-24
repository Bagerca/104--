/* =====================================================================
   FILE: js/views/EventsView.js
===================================================================== */
import { ApiService } from '../services/api.js';
import { EventsTemplate } from '../templates/EventsTemplate.js';

export class EventsView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
    }

    async mount() {
        this.isMounted = true;
        this.container.innerHTML = EventsTemplate.renderSkeletons();
        
        try {
            const events = await ApiService.getEvents();
            
            if (!this.isMounted) return;

            if (!events || events.length === 0) {
                this.container.innerHTML = EventsTemplate.renderEmpty();
                return;
            }

            this.container.innerHTML = EventsTemplate.renderList(events);

        } catch (error) {
            if (!this.isMounted) return;
            console.error('[EventsView] Ошибка загрузки ивентов:', error);
            this.container.innerHTML = EventsTemplate.renderError();
        }
    }

    unmount() {
        this.isMounted = false;
    }
}