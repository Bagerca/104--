/* =====================================================================
   FILE: js/views/HomeworkView.js
   ОПТИМИЗАЦИЯ: Делегирование событий и полная очистка памяти при unmount
===================================================================== */
import { ApiService } from '../services/api.js';
import { HomeworkTemplate } from '../templates/HomeworkTemplate.js';
import { Lightbox } from '../components/Lightbox.js';

const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(20);
};

const hashCode = (s) => Math.abs(s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));

export class HomeworkView {
    constructor(container) {
        this.container = container;
        this.storageKey = 'sh_homework_state';
        this.groupedData = {}; 
        
        // Биндим обработчик, чтобы иметь возможность удалить его в unmount
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    parseDateStr(dateStr) {
        const [d, m, y] = dateStr.split('-');
        return new Date(y, m - 1, d).getTime();
    }

    cleanUpOldTasks() {
        const currentState = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        let changed = false;

        for (const key in currentState) {
            const parts = key.split('_');
            const dateStr = parts[parts.length - 1]; 
            if (dateStr && /\d{2}-\d{2}-\d{4}/.test(dateStr)) {
                const [d, m, y] = dateStr.split('-');
                const taskTime = new Date(y, m - 1, d).getTime();
                if (now - taskTime > THIRTY_DAYS) {
                    delete currentState[key];
                    changed = true;
                }
            }
        }
        
        if (changed) {
            localStorage.setItem(this.storageKey, JSON.stringify(currentState));
        }
    }

    async mount() {
        this.container.innerHTML = HomeworkTemplate.renderSkeletons();
        
        // Включаем слушатель ДО отрисовки контента (Делегирование)
        this.container.addEventListener('click', this.handleGlobalClick);
        
        try {
            this.cleanUpOldTasks();
            
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
                const uniqueId = `${item.subject}_${hashCode(item.task)}_${item.date}`;
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

            this.renderMainList(false);

        } catch (error) {
            console.error('[HomeworkView] Ошибка:', error);
            this.container.innerHTML = HomeworkTemplate.renderError();
        }
    }

    switchViewWithTransition(renderCallback) {
        if (document.startViewTransition) {
            document.startViewTransition(() => renderCallback());
        } else {
            renderCallback();
        }
    }

    renderMainList(animate = true) {
        const render = () => {
            this.container.innerHTML = HomeworkTemplate.renderMainList(this.groupedData);
            this.validateLocalFiles();
        };
        if (animate) this.switchViewWithTransition(render);
        else render();
    }

    renderSubjectHistory(subject) {
        this.switchViewWithTransition(() => {
            this.container.innerHTML = HomeworkTemplate.renderSubjectHistory(subject, this.groupedData[subject]);
            this.validateLocalFiles();
        });
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

    // --- ЕДИНЫЙ ОБРАБОТЧИК СОБЫТИЙ (Event Delegation) ---
    handleGlobalClick(e) {
        // 1. Клик по фото
        const thumb = e.target.closest('.hw-image-thumb');
        if (thumb) {
            if (thumb.classList.contains('hw-broken')) return;
            triggerHaptic();
            const fullSrc = thumb.getAttribute('data-full');
            const fileName = fullSrc.split('/').pop() || 'photo.jpg';
            Lightbox.open(fullSrc, fileName);
            return;
        }

        // 2. Клик по кнопке "Все задания"
        const showAllBtn = e.target.closest('.hw-show-all-btn');
        if (showAllBtn) {
            triggerHaptic();
            this.renderSubjectHistory(showAllBtn.getAttribute('data-subject'));
            return;
        }

        // 3. Клик по кнопке "Назад"
        const backBtn = e.target.closest('#hw-back-btn');
        if (backBtn) {
            triggerHaptic();
            this.renderMainList(true);
            return;
        }

        // 4. Клик по карточке задания (Чекбокс)
        const card = e.target.closest('.hw-card');
        const isInteractive = e.target.closest('.interactive-element');
        
        if (card && !isInteractive) {
            triggerHaptic();
            const isCompleted = card.classList.toggle('completed');
            card.querySelector('.hw-checkbox').classList.toggle('checked');
            
            const hwId = card.getAttribute('data-id');
            this.updateStorage(hwId, isCompleted);
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
        // КРИТИЧЕСКИ ВАЖНО: Удаляем слушатель при переходе на другую вкладку
        this.container.removeEventListener('click', this.handleGlobalClick);
    }
}