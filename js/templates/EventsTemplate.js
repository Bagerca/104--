/* =====================================================================
   FILE: js/templates/EventsTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const EventsTemplate = {
    renderSkeletons() {
        return `
            <div class="skeleton" style="height: 300px; width: 100%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 250px; width: 100%;"></div>
        `;
    },

    renderEmpty() {
        return `<div class="placeholder-card" style="text-align: center; color: var(--text-muted)">Нет активных событий</div>`;
    },

    renderError() {
        return `<div class="placeholder-card">Ошибка загрузки ивентов.</div>`;
    },

    renderList(events) {
        return `
            <div class="events-list">
                ${events.map(ev => this.renderCard(ev)).join('')}
            </div>
        `;
    },

    renderCard(ev) {
        return `
            <article class="event-card">
                <div class="event-image">
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.title}" loading="lazy" decoding="async">` : ''}
                    <div class="event-date-badge">
                        <div class="day">${ev.date}</div>
                    </div>
                </div>
                <div class="event-body">
                    <h3 class="event-title">${ev.title}</h3>
                    ${ev.description ? `<p class="event-desc">${ev.description}</p>` : ''}
                    
                    ${(ev.location || ev.time) ? `
                        <div class="event-footer">
                            ${ev.location ? `
                                <span>
                                    ${getIcon('location', { size: 14 })}
                                    ${ev.location}
                                </span>
                            ` : ''}
                            ${ev.time ? `
                                <span>
                                    ${getIcon('clock', { size: 14 })}
                                    ${ev.time}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${ev.link ? `<a href="${ev.link}" target="_blank" class="event-btn">Подробнее / Вступить</a>` : ''}
                </div>
            </article>
        `;
    }
};