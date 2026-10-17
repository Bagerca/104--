/* =====================================================================
   FILE: js/templates/EventsTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const EventsTemplate = {
    renderSkeletons() {
        return `
            <div class="skeleton" style="height: 46px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 320px; width: 100%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 280px; width: 100%;"></div>
        `;
    },

    renderEmpty(message = 'Список пуст') {
        return `<div class="placeholder-card" style="text-align: center; color: var(--text-muted)">${message}</div>`;
    },

    renderError() {
        return `<div class="placeholder-card">Ошибка загрузки данных.</div>`;
    },

    renderBaseUI(currentTab) {
        return `
            <div class="events-container">
                <div class="events-segmented-control" id="events-toggle" data-active="${currentTab}">
                    <div class="events-segment-slider"></div>
                    <button class="events-segment-btn ${currentTab === 'events' ? 'active' : ''}" data-tab="events">Мероприятия</button>
                    <button class="events-segment-btn ${currentTab === 'holidays' ? 'active' : ''}" data-tab="holidays">События и Даты</button>
                </div>
                
                <div class="events-list-wrapper" id="events-list-wrapper">
                    <!-- Сюда инжектится нужный список -->
                </div>
            </div>
        `;
    },

    renderEventsList(events) {
        return `
            <div class="events-list">
                ${events.map(ev => this.renderEventCard(ev)).join('')}
            </div>
        `;
    },

    renderEventCard(ev) {
        const buttonText = ev.link_text || 'Перейти';
        
        let tagsHtml = '';
        if (ev.date && ev.date.toLowerCase() !== 'актуально') {
            tagsHtml += `<span class="ev-tag">${getIcon('clock', { size: 14 })} ${ev.date}</span>`;
        }
        if (ev.time && ev.time !== '24/7') {
            tagsHtml += `<span class="ev-tag">${getIcon('clock', { size: 14 })} ${ev.time}</span>`;
        }
        if (ev.location) {
            tagsHtml += `<span class="ev-tag location">${getIcon('location', { size: 14 })} ${ev.location}</span>`;
        }
        
        if (ev.badges && ev.badges.length > 0) {
            ev.badges.forEach(b => {
                if (b.copy) {
                    tagsHtml += `<span class="ev-tag copyable" data-copy="${b.copy}">${getIcon(b.icon || 'copy', { size: 14 })} ${b.text}</span>`;
                } else {
                    tagsHtml += `<span class="ev-tag">${getIcon(b.icon || 'info', { size: 14 })} ${b.text}</span>`;
                }
            });
        }

        const badgeHtml = (ev.date && ev.date.toLowerCase() === 'актуально') 
            ? `<div class="ev-status-badge">Актуально</div>` 
            : '';

        return `
            <article class="event-card slide-left">
                <div class="ev-image-wrapper">
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.title}" loading="lazy" decoding="async">` : ''}
                    <div class="ev-gradient-overlay"></div>
                    ${badgeHtml}
                </div>
                <div class="ev-content">
                    <h3 class="ev-title">${ev.title}</h3>
                    ${tagsHtml ? `<div class="ev-tags-group">${tagsHtml}</div>` : ''}
                    ${ev.description ? `<p class="ev-desc">${ev.description}</p>` : ''}
                    ${ev.link ? `
                        <a href="${ev.link}" target="_blank" class="ev-action-btn">
                            <span>${buttonText}</span>
                        </a>
                    ` : ''}
                </div>
            </article>
        `;
    },

    renderHolidaysList(holidays) {
        return `
            <div class="holidays-list slide-right">
                ${holidays.map(h => this.renderHolidayCard(h)).join('')}
            </div>
        `;
    },

    renderHolidayCard(h) {
        // Динамический класс состояния (Сегодня / Близко / Обычное)
        let stateClass = '';
        if (h.diffDays === 0) stateClass = 'today';
        else if (h.isNear) stateClass = 'near';

        return `
            <article class="holiday-card ${stateClass}">
                <div class="holiday-icon">
                    ${getIcon(h.icon || 'star', { size: 24 })}
                </div>
                <div class="holiday-info">
                    <div class="holiday-title">${h.title}</div>
                    <div class="holiday-date">${h.formattedDate}</div>
                </div>
                <div class="holiday-badge">
                    ${h.timeLeftText}
                </div>
            </article>
        `;
    }
};