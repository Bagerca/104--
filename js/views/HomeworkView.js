/* =====================================================================
   FILE: js/views/HomeworkView.js
   ОПТИМИЗАЦИЯ: Использование HomeworkTemplate и глобального Lightbox.
===================================================================== */
import { ApiService } from '../services/api.js';
import { HomeworkTemplate } from '../templates/HomeworkTemplate.js';
import { Lightbox } from '../components/Lightbox.js';

const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(20);
};

export class HomeworkView {
    constructor(container) {
        this.container = container;
        this.storageKey = 'sh_homework_state';
        this.groupedData = {}; 
    }

    parseDateStr(dateStr) {
        const [d, m, y] = dateStr.split('-');
        return new Date(y, m - 1, d).getTime();
    }

    async mount() {
        this.container.innerHTML = HomeworkTemplate.renderSkeletons();
        
        try {
            const [hwTasks, teachersData] = await Promise.all([
                ApiService.getHomework(),
                ApiService.getTeachers()
            ]);
            
            if (!hwTasks || hwTasks.length === 0) {
                this.container.innerHTML = HomeworkTemplate.renderEmpty();
                return;
            }

            const savedState = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            const processedTasks = hwTasks.map(item => {
                const uniqueId = `${item.subject}_${item.date}`;
                const teacherName = (teachersData && teachersData[item.subject]) ? teachersData[item.subject].name : 'Преподаватель не указан';
                
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
            this.container.innerHTML = HomeworkTemplate.renderError();
        }
    }

    renderMainList() {
        this.container.innerHTML = HomeworkTemplate.renderMainList(this.groupedData);
        this.bindEvents('main');
        this.validateLocalFiles();
    }

    renderSubjectHistory(subject) {
        this.container.innerHTML = HomeworkTemplate.renderSubjectHistory(subject, this.groupedData[subject]);
        this.bindEvents('history');
        this.validateLocalFiles();
    }

    async validateLocalFiles() {
        const filesToCheck = Array.from(this.container.querySelectorAll('.local-file-check'));
        if (filesToCheck.length === 0) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const promises = filesToCheck.map(el => {
            const url = el.getAttribute('data-url');
            if (!url) return Promise.reject();
            
            return fetch(url, { method: 'HEAD', signal: controller.signal })
                .then(res => { if (!res.ok) el.classList.add('hw-broken'); })
                .catch(() => el.classList.add('hw-broken'));
        });

        await Promise.allSettled(promises);
        clearTimeout(timeoutId);
    }

    bindEvents(viewType) {
        // Открытие фото через ГЛОБАЛЬНЫЙ Lightbox
        this.container.querySelectorAll('.hw-image-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if (thumb.classList.contains('hw-broken')) return;
                triggerHaptic();
                const fullSrc = thumb.getAttribute('data-full');
                const fileName = fullSrc.split('/').pop() || 'photo.jpg';
                Lightbox.open(fullSrc, fileName);
            });
        });

        // Чекбоксы
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

        // Переходы
        if (viewType === 'main') {
            this.container.querySelectorAll('.hw-show-all-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    triggerHaptic();
                    this.renderSubjectHistory(e.currentTarget.getAttribute('data-subject'));
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

    unmount() {}
}