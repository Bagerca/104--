/* =====================================================================
   FILE: js/templates/HomeworkTemplate.js
   Шаблоны для раздела Домашних заданий
===================================================================== */
export const HomeworkTemplate = {
    renderSkeletons() {
        return `
            <div class="skeleton" style="height: 150px; width: 100%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 150px; width: 100%;"></div>
        `;
    },

    renderEmpty() {
        return `<div class="placeholder-card" style="text-align: center; color: var(--text-muted)">Домашки пока нет 🎉</div>`;
    },

    renderError() {
        return `<div class="placeholder-card">Ошибка загрузки ДЗ.</div>`;
    },

    generateResourcesHTML(task) {
        let extraHtml = '';
        const hasLinks = task.links && task.links.length > 0;
        const hasAttachments = task.attachments && task.attachments.length > 0;
        const hasImages = task.images && task.images.length > 0;

        if (hasLinks || hasAttachments || hasImages) {
            extraHtml += `<div class="hw-resources">`;
            
            if (hasLinks) {
                task.links.forEach(link => {
                    extraHtml += `
                        <a href="${link.url}" target="_blank" class="hw-link interactive-element">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            <span>${link.title}</span>
                        </a>
                    `;
                });
            }

            if (hasAttachments) {
                task.attachments.forEach(file => {
                    extraHtml += `
                        <a href="${file.url}" target="_blank" class="hw-attachment interactive-element local-file-check" data-url="${file.url}">
                            <div class="hw-file-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <div class="hw-file-info">
                                <span class="hw-file-name">${file.name}</span>
                                <span class="hw-file-meta">${file.type} Документ</span>
                            </div>
                        </a>
                    `;
                });
            }

            if (hasImages) {
                extraHtml += `<div class="hw-image-grid">`;
                task.images.forEach(img => {
                    extraHtml += `
                        <div class="hw-image-thumb interactive-element" data-full="${img.url}">
                            <img src="${img.url}" loading="lazy" onerror="this.parentElement.classList.add('hw-broken'); this.remove();">
                        </div>
                    `;
                });
                extraHtml += `</div>`;
            }
            extraHtml += `</div>`;
        }
        return extraHtml;
    },

    renderTaskCard(task, isHistory = false) {
        return `
            <div class="hw-card ${isHistory ? 'history-item' : ''} ${task.done ? 'completed' : ''}" data-id="${task.id}">
                <div class="hw-checkbox ${task.done ? 'checked' : ''}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="hw-content">
                    <div class="hw-task">${task.task}</div>
                    ${this.generateResourcesHTML(task)}
                    <div class="hw-meta">
                        <span>Задано: ${task.date}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderMainList(groupedData) {
        let html = '<div class="hw-container">';
        for (let subject in groupedData) {
            const tasks = groupedData[subject];
            const latestTask = tasks[0]; 
            const teacher = latestTask.teacher;
            
            html += `
                <div class="hw-subject-card">
                    <div class="hw-subject-header">
                        <div>
                            <div class="hw-subject-name">${subject}</div>
                            <div class="hw-teacher-name">${teacher}</div>
                        </div>
                    </div>
                    ${this.renderTaskCard(latestTask, false)}
            `;

            if (tasks.length > 1) {
                html += `
                    <button class="hw-show-all-btn" data-subject="${subject}">
                        Все задания (${tasks.length})
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                `;
            }
            html += `</div>`;
        }
        html += '</div>';
        return html;
    },

    renderSubjectHistory(subject, tasks) {
        const teacher = tasks[0].teacher;
        let html = `
            <div class="hw-container slide-left">
                <div class="hw-history-header">
                    <button class="hw-back-btn" id="hw-back-btn" aria-label="Назад">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div class="hw-history-title">
                        <h2>${subject}</h2>
                        <span>${teacher}</span>
                    </div>
                </div>
                <div class="hw-list">
        `;
        tasks.forEach(task => { html += this.renderTaskCard(task, true); });
        html += `</div></div>`;
        return html;
    }
};