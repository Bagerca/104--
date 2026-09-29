import { ApiService } from '../services/api.js';
import { Lightbox } from '../components/Lightbox.js';
import { HomeworkTemplate } from '../templates/HomeworkTemplate.js';
import { Store } from '../store.js';

const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(20); };
const hashCode = (s) => Math.abs(s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));

export class HomeworkView {
    constructor(container) {
        this.container = container;
        this.groupedData = {}; 
        this.isMounted = false;
        this.currentParams = {};
        this.unsubscribe = null;
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    // ... cleanUpOldTasks & parseDateStr остаются без изменений ...

    async mount(params = {}) {
        this.isMounted = true;
        this.currentParams = params;
        this.container.innerHTML = HomeworkTemplate.renderSkeletons();
        this.container.addEventListener('click', this.handleGlobalClick);
        
        this.unsubscribe = Store.subscribe((state, key) => {
            if (key === 'homework' && this.isMounted) this.renderBasedOnParams(); // Обновление при сбросе
        });

        try {
            const [hwTasks, teachersData] = await Promise.all([ApiService.getHomework(), ApiService.getTeachers()]);
            if (!this.isMounted) return;

            if (!hwTasks || hwTasks.length === 0) {
                this.container.innerHTML = HomeworkTemplate.renderEmpty();
                return;
            }

            const savedState = Store.getState().homeworkTasks;
            
            const processedTasks = hwTasks.map(item => {
                const uniqueId = `${item.subject}_${hashCode(item.task)}_${item.date}`;
                const teacherName = (teachersData && teachersData[item.subject]) ? teachersData[item.subject].name : 'Не указан';
                return { ...item, id: uniqueId, teacher: teacherName, done: savedState[uniqueId] || false };
            });

            this.groupedData = processedTasks.reduce((acc, item) => {
                if (!acc[item.subject]) acc[item.subject] = [];
                acc[item.subject].push(item);
                return acc;
            }, {});

            this.renderBasedOnParams();
        } catch (error) {
            if (this.isMounted) this.container.innerHTML = HomeworkTemplate.renderError();
        }
    }

    async update(params = {}) {
        this.currentParams = params;
        this.renderBasedOnParams();
    }

    renderBasedOnParams() {
        if (!this.isMounted) return;
        const subject = this.currentParams.subject;
        
        if (subject && this.groupedData[subject]) {
            this.container.innerHTML = HomeworkTemplate.renderSubjectHistory(subject, this.groupedData[subject]);
        } else {
            this.container.innerHTML = HomeworkTemplate.renderMainList(this.groupedData);
        }
    }

    handleGlobalClick(e) {
        const thumb = e.target.closest('.hw-image-thumb');
        if (thumb && !thumb.classList.contains('hw-broken')) {
            triggerHaptic();
            Lightbox.open(thumb.getAttribute('data-full'));
            return;
        }

        const showAllBtn = e.target.closest('.hw-show-all-btn');
        if (showAllBtn) {
            triggerHaptic();
            window.location.hash = `#/homework?subject=${encodeURIComponent(showAllBtn.getAttribute('data-subject'))}`;
            return;
        }

        if (e.target.closest('#hw-back-btn')) {
            triggerHaptic();
            window.history.back(); 
            return;
        }

        const card = e.target.closest('.hw-card');
        if (card && !e.target.closest('.interactive-element')) {
            triggerHaptic();
            const isCompleted = card.classList.toggle('completed');
            card.querySelector('.hw-checkbox').classList.toggle('checked');
            
            const hwId = card.getAttribute('data-id');
            Store.setHomeworkTask(hwId, isCompleted);
            
            // Синхронизируем локальный стейт массива для мгновенных переключений
            for (let subj in this.groupedData) {
                const task = this.groupedData[subj].find(t => t.id === hwId);
                if (task) task.done = isCompleted;
            }
        }
    }

    unmount() {
        this.isMounted = false;
        if (this.unsubscribe) this.unsubscribe();
        this.container.removeEventListener('click', this.handleGlobalClick);
    }
}