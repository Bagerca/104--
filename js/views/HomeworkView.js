/* =====================================================================
   FILE: js/views/HomeworkView.js
===================================================================== */
import { ApiService } from '../services/api.js';

const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(20);
};

export class HomeworkView {
    constructor(container) {
        this.container = container;
        this.storageKey = 'sh_homework_state';
        this.groupedData = {}; 
    }

    // Инициализация просмотрщика фото (Lightbox)
    initLightbox() {
        // Очищаем старый диалог, если он остался в DOM после переходов
        const oldDialog = document.getElementById('hw-lightbox');
        if (oldDialog) oldDialog.remove();

        const dialog = document.createElement('dialog');
        dialog.id = 'hw-lightbox';
        dialog.className = 'hw-lightbox';
        
        // Используем нативную форму form method="dialog" для 100% рабочего крестика
        dialog.innerHTML = `
            <div class="hw-lightbox-controls">
                <a id="hw-lightbox-download" href="" download class="hw-lightbox-btn" aria-label="Скачать">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
                <form method="dialog" style="margin: 0; padding: 0;">
                    <button class="hw-lightbox-btn" type="submit" aria-label="Закрыть">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </form>
            </div>
            <div class="hw-lightbox-body" id="hw-lightbox-body">
                <img id="hw-lightbox-img" src="" alt="Фото">
            </div>
        `;
        document.body.appendChild(dialog);

        // Закрытие при клике на пустое пространство вокруг картинки
        dialog.querySelector('#hw-lightbox-body').addEventListener('click', (e) => {
            if (e.target.id === 'hw-lightbox-body') {
                dialog.close();
            }
        });
    }

    parseDateStr(dateStr) {
        const [d, m, y] = dateStr.split('-');
        return new Date(y, m - 1, d).getTime();
    }

    async mount() {
        this.container.innerHTML = `
            <div class="skeleton" style="height: 150px; width: 100%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 150px; width: 100%;"></div>
        `;
        
        try {
            this.initLightbox(); // Создаем окно при загрузке страницы

            const [hwTasks, teachersData] = await Promise.all([
                ApiService.getHomework(),
                ApiService.getTeachers()
            ]);
            
            if (!hwTasks || hwTasks.length === 0) {
                this.container.innerHTML = `<div class="placeholder-card" style="text-align: center; color: var(--text-muted)">Домашки пока нет 🎉</div>`;
                return;
            }

            const savedState = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            const processedTasks = hwTasks.map(item => {
                const uniqueId = `${item.subject}_${item.date}`;
                const teacherName = (teachersData && teachersData[item.subject]) ? teachersData[item.subject] : 'Преподаватель не указан';
                
                return {
                    ...item,
                    id: uniqueId,
                    teacher: teacherName,
                    done: savedState[uniqueId] || false
                };
            });

            this.groupedData = processedTasks.reduce((acc, item) => {
                if (!acc[item.subject]) acc[item.subject] = [];
                acc[item.subject].push(item);
                return acc;
            }, {});

            for (let subject in this.groupedData) {
                this.groupedData[subject].sort((a, b) => this.parseDateStr(b.date) - this.parseDateStr(a.date));
            }

            this.renderMainList();

        } catch (error) {
            console.error('[HomeworkView] Ошибка:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки ДЗ.</div>`;
        }
    }

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
    }

    renderMainList() {
        let html = '<div class="hw-container">';
        
        for (let subject in this.groupedData) {
            const tasks = this.groupedData[subject];
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
                    
                    <div class="hw-card ${latestTask.done ? 'completed' : ''}" data-id="${latestTask.id}">
                        <div class="hw-checkbox ${latestTask.done ? 'checked' : ''}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="hw-content">
                            <div class="hw-task">${latestTask.task}</div>
                            ${this.generateResourcesHTML(latestTask)}
                            <div class="hw-meta">
                                <span>Задано: ${latestTask.date}</span>
                            </div>
                        </div>
                    </div>
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
        this.container.innerHTML = html;
        this.bindEvents('main');
        this.validateLocalFiles();
    }

    renderSubjectHistory(subject) {
        const tasks = this.groupedData[subject];
        const teacher = tasks[0].teacher;

        let html = `
            <div class="hw-container">
                <div class="hw-history-header">
                    <button class="hw-back-btn" id="hw-back-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div class="hw-history-title">
                        <h2>${subject}</h2>
                        <span>${teacher}</span>
                    </div>
                </div>
                <div class="hw-list">
        `;

        tasks.forEach(task => {
            html += `
                <div class="hw-card history-item ${task.done ? 'completed' : ''}" data-id="${task.id}">
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
        });

        html += `</div></div>`;
        this.container.innerHTML = html;
        this.bindEvents('history');
        this.validateLocalFiles();
    }

    async validateLocalFiles() {
        const filesToCheck = this.container.querySelectorAll('.local-file-check');
        for (let el of filesToCheck) {
            const url = el.getAttribute('data-url');
            if (url) {
                try {
                    const res = await fetch(url, { method: 'HEAD' });
                    if (!res.ok) el.classList.add('hw-broken');
                } catch (e) {
                    el.classList.add('hw-broken');
                }
            }
        }
    }

    bindEvents(viewType) {
        // Открытие фоток и настройка ссылки скачивания
        this.container.querySelectorAll('.hw-image-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if (thumb.classList.contains('hw-broken')) return;
                triggerHaptic();
                
                const fullSrc = thumb.getAttribute('data-full');
                const dialog = document.getElementById('hw-lightbox');
                const img = document.getElementById('hw-lightbox-img');
                const downloadBtn = document.getElementById('hw-lightbox-download');
                
                img.src = fullSrc;
                downloadBtn.href = fullSrc;
                
                // Вытаскиваем имя файла из пути для скачивания (например "photo.jpg")
                const fileName = fullSrc.split('/').pop() || 'photo.jpg';
                downloadBtn.setAttribute('download', fileName);
                
                dialog.showModal();
            });
        });

        this.container.querySelectorAll('.hw-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.interactive-element')) return;

                triggerHaptic();
                const isCompleted = card.classList.toggle('completed');
                card.querySelector('.hw-checkbox').classList.toggle('checked');
                
                const hwId = card.getAttribute('data-id');
                this.updateStorage(hwId, isCompleted);
            });
        });

        if (viewType === 'main') {
            this.container.querySelectorAll('.hw-show-all-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    triggerHaptic();
                    const subject = e.currentTarget.getAttribute('data-subject');
                    this.renderSubjectHistory(subject);
                });
            });
        } else if (viewType === 'history') {
            document.getElementById('hw-back-btn').addEventListener('click', () => {
                triggerHaptic();
                this.renderMainList();
            });
        }
    }

    updateStorage(id, isCompleted) {
        const currentState = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        currentState[id] = isCompleted;
        localStorage.setItem(this.storageKey, JSON.stringify(currentState));
        
        for (let subj in this.groupedData) {
            const task = this.groupedData[subj].find(t => t.id === id);
            if (task) task.done = isCompleted;
        }
    }

    unmount() {
        // Зачищаем диалог при уходе со страницы, чтобы он не висел в DOM мертвым грузом
        const dialog = document.getElementById('hw-lightbox');
        if (dialog) dialog.remove();
    }
}