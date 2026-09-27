/* =====================================================================
   FILE: js/templates/HomeworkTemplate.js
   Шаблоны для раздела Домашних заданий
===================================================================== */
import { getIcon } from '../utils/icons.js';

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
                            ${getIcon('link', { size: 16 })}
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
                                ${getIcon('file', { size: 18 })}
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
                    ${getIcon('check', { size: 14, color: '#fff', strokeWidth: 3 })}
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
                        ${getIcon('chevron-right', { size: 16 })}
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
                        ${getIcon('back', { size: 20 })}
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