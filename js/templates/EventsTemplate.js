/* =====================================================================
   FILE: js/templates/EventsTemplate.js
   Шаблоны для раздела Ивентов
===================================================================== */
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
                    <!-- Блок с градиентом удален, теперь работает CSS mask-image -->
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    ${ev.location}
                                </span>
                            ` : ''}
                            ${ev.time ? `
                                <span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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