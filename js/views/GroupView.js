/* =====================================================================
   FILE: js/views/GroupView.js
===================================================================== */
import { ApiService } from '../services/api.js';

const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
};

export class GroupView {
    constructor(container) {
        this.container = container;
        this.currentTab = 'students'; // По умолчанию показываем студентов
        this.studentsData = [];
        this.teachersData = [];
    }

    async mount() {
        // Скелетоны при загрузке
        this.container.innerHTML = `
            <div class="skeleton" style="height: 46px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 60px; width: 100%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 72px; width: 100%; margin-bottom: 12px;"></div>
        `;
        
        try {
            // Грузим оба списка параллельно
            const [students, teachers] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getTeachers()
            ]);

            this.studentsData = students || [];
            
            // Преобразуем объект преподавателей в массив для удобного рендера
            if (teachers) {
                this.teachersData = Object.entries(teachers).map(([subject, name]) => ({
                    subject, 
                    name: name.includes('...') ? 'Имя уточняется' : name
                }));
                // Сортируем преподов по алфавиту предметов
                this.teachersData.sort((a, b) => a.subject.localeCompare(b.subject));
            }

            this.renderBaseUI();
            this.renderList();
            this.bindEvents();

        } catch (error) {
            console.error('[GroupView] Ошибка:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки данных.</div>`;
        }
    }

    // Генерация случайного, но фиксированного цвета для аватарки
    getGradient(text) {
        const charCode = text.charCodeAt(0) + (text.charCodeAt(1) || 0) + (text.charCodeAt(2) || 0);
        const hue = charCode % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 40}, 70%, 40%))`;
    }

    // Базовый каркас страницы (Переключатель и контейнер для списка)
    renderBaseUI() {
        this.container.innerHTML = `
            <div class="group-container">
                <div class="group-segmented-control" id="group-toggle" data-active="${this.currentTab}">
                    <div class="group-segment-slider"></div>
                    <button class="group-segment-btn ${this.currentTab === 'students' ? 'active' : ''}" data-tab="students">Студенты</button>
                    <button class="group-segment-btn ${this.currentTab === 'teachers' ? 'active' : ''}" data-tab="teachers">Преподаватели</button>
                </div>
                
                <section class="group-stats" id="group-stats"></section>
                
                <div class="list-wrapper" id="list-wrapper">
                    <ul class="persons-list" id="persons-list"></ul>
                </div>
            </div>
        `;
    }

    // Рендер конкретного списка в зависимости от выбранной вкладки
    renderList() {
        const statsContainer = document.getElementById('group-stats');
        const listContainer = document.getElementById('persons-list');
        
        let html = '';

        if (this.currentTab === 'students') {
            statsContainer.innerHTML = `
                <span>Всего: <strong>${this.studentsData.length}</strong> чел.</span>
                <span>104к</span>
            `;

            html = this.studentsData.map(st => {
                const initial = st.name.charAt(0).toUpperCase();
                const avatar = !st.avatar ? 
                    `<div class="person-avatar" style="background: ${this.getGradient(st.name)}">${initial}</div>` : 
                    `<div class="person-avatar" style="padding: 0; overflow: hidden;"><img src="${st.avatar}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${st.name}"></div>`;
                
                const role = st.role ? `<span class="person-badge">${st.role}</span>` : '';
                const tgBtn = st.tg ? `<a href="https://t.me/${st.tg}" target="_blank" class="person-action-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>` : '';
                
                return `
                    <li class="person-card">
                        ${avatar}
                        <div class="person-info">
                            <div class="person-name-row">${st.name} ${role}</div>
                            <div class="person-sub">@${st.nickname}</div>
                        </div>
                        ${tgBtn}
                    </li>`;
            }).join('');
        } 
        else if (this.currentTab === 'teachers') {
            statsContainer.innerHTML = `
                <span>Преподавателей: <strong>${this.teachersData.length}</strong></span>
                <span>104к</span>
            `;

            html = this.teachersData.map(tch => {
                // Берем первую букву Имени (а не предмета). Если имени нет - ставим ?
                const initial = tch.name !== 'Имя уточняется' ? tch.name.charAt(0).toUpperCase() : '?';
                const avatar = `<div class="person-avatar" style="background: ${this.getGradient(tch.subject)}">${initial}</div>`;
                
                return `
                    <li class="person-card">
                        ${avatar}
                        <div class="person-info">
                            <div class="person-name-row">${tch.name}</div>
                            <div class="person-sub"><span class="person-badge teacher-subject">${tch.subject}</span></div>
                        </div>
                    </li>`;
            }).join('');
        }

        listContainer.innerHTML = html || `<li class="placeholder-card" style="text-align:center;">Список пуст</li>`;
    }

    bindEvents() {
        const toggle = document.getElementById('group-toggle');
        const wrapper = document.getElementById('list-wrapper');
        const btns = this.container.querySelectorAll('.group-segment-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                if (this.currentTab === targetTab) return; // Уже активна
                
                triggerHaptic();
                this.currentTab = targetTab;

                // Обновляем визуальное состояние кнопок и ползунка
                toggle.setAttribute('data-active', this.currentTab);
                btns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Анимация затухания списка
                wrapper.classList.add('fading');
                setTimeout(() => {
                    this.renderList();
                    wrapper.classList.remove('fading');
                }, 200); // 200ms должно совпадать с transition в CSS
            });
        });
    }

    unmount() {} 
}