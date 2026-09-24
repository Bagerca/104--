/* =====================================================================
   FILE: js/views/GroupView.js
   ОПТИМИЗАЦИЯ: Делегирование событий и правильный unmount
===================================================================== */
import { ApiService } from '../services/api.js';
import { GroupTemplate } from '../templates/GroupTemplate.js';
import { UIUtils } from '../utils/ui.js';
import { PrefsManager } from '../utils/prefs.js';

export class GroupView {
    constructor(container) {
        this.container = container;
        this.currentTab = 'students'; 
        this.studentsData = [];
        this.teachersData = [];
        
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    async mount() {
        this.container.innerHTML = GroupTemplate.renderSkeletons();
        
        // Вешаем глобальный слушатель
        this.container.addEventListener('click', this.handleGlobalClick);
        
        try {
            const [students, teachers] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getTeachers()
            ]);

            this.studentsData = students || [];
            
            if (teachers) {
                const groupedTeachers = {};
                Object.entries(teachers).forEach(([subject, data]) => {
                    const rawName = data.name;
                    const displayName = rawName.includes('...') ? 'Имя уточняется' : rawName;

                    if (!groupedTeachers[rawName]) {
                        groupedTeachers[rawName] = {
                            name: displayName,
                            rawName: rawName, 
                            avatar: data.avatar || '',
                            subjects: []
                        };
                    }
                    groupedTeachers[rawName].subjects.push(subject);
                });

                this.teachersData = Object.values(groupedTeachers);
                this.teachersData.sort((a, b) => a.name.localeCompare(b.name));
            }

            this.container.innerHTML = GroupTemplate.renderBaseUI(this.currentTab);
            this.renderList();

        } catch (error) {
            console.error('[GroupView] Ошибка:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки данных.</div>`;
        }
    }

    renderList() {
        const statsContainer = document.getElementById('group-stats');
        const listContainer = document.getElementById('persons-list');
        if (!statsContainer || !listContainer) return;
        
        let html = '';

        if (this.currentTab === 'students') {
            statsContainer.innerHTML = GroupTemplate.renderStats('students', this.studentsData.length);

            html = this.studentsData.map(st => {
                const initial = st.name.charAt(0).toUpperCase();
                const avatar = !st.avatar ? 
                    `<div class="person-avatar" style="background: ${UIUtils.getAvatarGradient(st.name)}">${initial}</div>` : 
                    `<div class="person-avatar" style="padding: 0; overflow: hidden;"><img src="${st.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${st.name}" loading="lazy" decoding="async"></div>`;
                
                const role = st.role ? `<span class="person-badge">${st.role}</span>` : '';
                const tgBtn = st.tg ? `<a href="https://t.me/${st.tg}" target="_blank" class="person-action-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>` : '';
                
                return GroupTemplate.renderPerson(st.name, `@${st.nickname}`, avatar, role, tgBtn);
            }).join('');
        } 
        else if (this.currentTab === 'teachers') {
            statsContainer.innerHTML = GroupTemplate.renderStats('teachers', this.teachersData.length);

            html = this.teachersData.map(tch => {
                const initial = tch.name !== 'Имя уточняется' ? tch.name.charAt(0).toUpperCase() : '?';
                const avatar = !tch.avatar ? 
                    `<div class="person-avatar" style="background: ${UIUtils.getAvatarGradient(tch.rawName)}">${initial}</div>` : 
                    `<div class="person-avatar" style="padding: 0; overflow: hidden;"><img src="${tch.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${tch.name}" loading="lazy" decoding="async"></div>`;
                
                const subjectsHtml = tch.subjects.map(subj => `<span class="person-badge teacher-subject">${subj}</span>`).join('');
                return GroupTemplate.renderPerson(tch.name, subjectsHtml, avatar);
            }).join('');
        }

        listContainer.innerHTML = html || `<li class="placeholder-card" style="text-align:center;">Список пуст</li>`;
    }

    // --- Делегирование событий ---
    handleGlobalClick(e) {
        const btn = e.target.closest('.group-segment-btn');
        if (!btn) return;

        const targetTab = btn.getAttribute('data-tab');
        if (this.currentTab === targetTab) return; 
        
        PrefsManager.vibrate(15);
        this.currentTab = targetTab;

        const toggle = document.getElementById('group-toggle');
        const wrapper = document.getElementById('list-wrapper');
        
        if (toggle) toggle.setAttribute('data-active', this.currentTab);
        
        this.container.querySelectorAll('.group-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (wrapper) {
            // Используем requestAnimationFrame для синхронизации с отрисовкой браузера
            requestAnimationFrame(() => {
                wrapper.classList.add('fading');
                setTimeout(() => {
                    this.renderList();
                    wrapper.classList.remove('fading');
                }, 200); 
            });
        }
    }

    unmount() {
        this.container.removeEventListener('click', this.handleGlobalClick);
    } 
}