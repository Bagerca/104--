/* =====================================================================
   FILE: js/views/EventsView.js
===================================================================== */
import { ApiService } from '../services/api.js';
import { EventsTemplate } from '../templates/EventsTemplate.js';
import { Toast } from '../components/Toast.js';
import { PrefsManager } from '../utils/prefs.js';
import { getHolidayStatus } from '../utils/time.js';

export class EventsView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        this.currentTab = 'events'; 
        
        this.eventsData = [];
        this.holidaysData = [];
        
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    async mount() {
        this.isMounted = true;
        this.container.innerHTML = EventsTemplate.renderSkeletons();
        
        this.container.addEventListener('click', this.handleGlobalClick);
        
        try {
            const [events, holidays] = await Promise.all([
                ApiService.getEvents(),
                ApiService.getHolidays()
            ]);
            
            if (!this.isMounted) return;

            this.eventsData = events || [];
            this.holidaysData = this.processHolidays(holidays || []);

            this.container.innerHTML = EventsTemplate.renderBaseUI(this.currentTab);
            this.renderCurrentList();

        } catch (error) {
            if (!this.isMounted) return;
            console.error('[EventsView] Ошибка загрузки:', error);
            this.container.innerHTML = EventsTemplate.renderError();
        }
    }

    processHolidays(rawHolidays) {
        const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

        return rawHolidays.map(h => {
            const status = getHolidayStatus(h.date);
            const d = status.targetDate;

            return {
                ...h,
                diffDays: status.isToday ? 0 : status.diffDays,
                isNear: status.diffDays <= 7 || status.isToday,
                timeLeftText: status.timeText,
                formattedDate: `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()} г.`
            };
        }).sort((a, b) => a.diffDays - b.diffDays);
    }

    renderCurrentList() {
        if (!this.isMounted) return;
        const wrapper = document.getElementById('events-list-wrapper');
        if (!wrapper) return;

        if (this.currentTab === 'events') {
            if (this.eventsData.length === 0) {
                wrapper.innerHTML = EventsTemplate.renderEmpty('Нет активных мероприятий');
            } else {
                wrapper.innerHTML = EventsTemplate.renderEventsList(this.eventsData);
            }
        } else {
            if (this.holidaysData.length === 0) {
                wrapper.innerHTML = EventsTemplate.renderEmpty('Нет ближайших событий');
            } else {
                wrapper.innerHTML = EventsTemplate.renderHolidaysList(this.holidaysData);
            }
        }
    }

    handleGlobalClick(e) {
        const copyTag = e.target.closest('.ev-tag.copyable');
        if (copyTag) {
            PrefsManager.vibrate(10);
            const textToCopy = copyTag.getAttribute('data-copy');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    Toast.show('Скопировано!', 'success', 2000);
                }).catch(() => Toast.show('Ошибка', 'warning', 2000));
            }
            return;
        }

        const btn = e.target.closest('.events-segment-btn');
        if (btn) {
            const targetTab = btn.getAttribute('data-tab');
            if (this.currentTab === targetTab) return; 
            
            PrefsManager.vibrate(15);
            this.currentTab = targetTab;

            const toggle = document.getElementById('events-toggle');
            const wrapper = document.getElementById('events-list-wrapper');
            
            if (toggle) toggle.setAttribute('data-active', this.currentTab);
            
            this.container.querySelectorAll('.events-segment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (wrapper) {
                requestAnimationFrame(() => {
                    if (!this.isMounted) return;
                    wrapper.classList.add('fading');
                    setTimeout(() => {
                        if (!this.isMounted) return;
                        this.renderCurrentList();
                        wrapper.classList.remove('fading');
                    }, 200); 
                });
            }
        }
    }

    unmount() {
        this.isMounted = false;
        this.container.removeEventListener('click', this.handleGlobalClick);
    }
}