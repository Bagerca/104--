/* =====================================================================
   FILE: js/templates/GroupTemplate.js
===================================================================== */
export const GroupTemplate = {
    renderSkeletons() {
        return `
            <div class="skeleton" style="height: 46px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 60px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
        `;
    },

    renderBaseUI(currentTab) {
        return `
            <div class="group-container">
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

    renderPerson(name, subText, avatarHtml, roleHtml = '', actionBtnHtml = '') {
        return `
            <li class="person-card">
                ${avatarHtml}
                <div class="person-info">
                    <div class="person-name-row">
                        <span class="person-name-text">${name}</span>
                        ${roleHtml}
                    </div>
                    <div class="person-sub" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: ${roleHtml.includes('teacher-subject') ? '6px' : '2px'}; white-space: normal;">
                        ${subText}
                    </div>
                </div>
                ${actionBtnHtml}
            </li>`;
    }
};