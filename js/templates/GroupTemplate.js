/* =====================================================================
   FILE: js/templates/GroupTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const GroupTemplate = {
    renderSkeletons() {
        return `
            <div class="skeleton" style="height: 78px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 46px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 60px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
        `;
    },

    renderBaseUI(currentTab) {
        return `
            <div class="group-container">
                <div class="group-services">
                    <a href="https://college.obr.lenreg.ru/security/#/login" target="_blank" class="service-btn">
                        ${getIcon('academic-cap', { size: 28 })}
                        <span>Журнал / Оценки</span>
                    </a>
                    <a href="https://znanium.ru/" target="_blank" class="service-btn">
                        ${getIcon('book-open', { size: 28 })}
                        <span>Библиотека</span>
                    </a>
                </div>

                <div class="group-segmented-control" id="group-toggle" data-active="${currentTab}">
                    <div class="group-segment-slider"></div>
                    <button class="group-segment-btn ${currentTab === 'students' ? 'active' : ''}" data-tab="students">Студенты</button>
                    <button class="group-segment-btn ${currentTab === 'teachers' ? 'active' : ''}" data-tab="teachers">Преподаватели</button>
                </div>
                
                <section class="group-stats" id="group-stats"></section>
                
                <div class="list-wrapper" id="list-wrapper">
                    <ul class="persons-list" id="persons-list"></ul>
                </div>
            </div>
        `;
    },

    renderStats(type, count) {
        if (type === 'students') {
            return `<span>Всего: <strong>${count}</strong> чел.</span><span>104к</span>`;
        }
        return `<span>Преподавателей: <strong>${count}</strong></span><span>104к</span>`;
    },

    // ДОБАВЛЕН ПАРАМЕТР id
    renderPerson(id, name, subText, avatarHtml, roleHtml = '', actionBtnHtml = '') {
        if (actionBtnHtml === 'TG_BTN') {
            actionBtnHtml = `<a href="https://t.me/${subText.replace('@','')}" target="_blank" class="person-action-btn">${getIcon('telegram', { size: 18 })}</a>`;
        }
        
        const subTextHtml = subText ? `
            <div class="person-sub" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: ${roleHtml.includes('teacher-subject') ? '6px' : '2px'}; white-space: normal;">
                ${subText}
            </div>` : '';

        return `
            <li class="person-card" data-id="${id}"> <!-- ТЕПЕРЬ ТУТ ЕСТЬ ИДЕНТИФИКАТОР -->
                ${avatarHtml}
                <div class="person-info">
                    <div class="person-name-row">
                        <span class="person-name-text">${name}</span>
                        ${roleHtml}
                    </div>
                    ${subTextHtml}
                </div>
                ${actionBtnHtml}
            </li>`;
    }
};