/* =====================================================================
   FILE: js/views/GroupView.js
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
        this.adminData = [];
        this.teachersData = [];
        this.isMounted = false;
        
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    _processPersons(sourceObject) {
        const grouped = {};
        Object.entries(sourceObject).forEach(([role, data]) => {
            const rawName = data.name;
            if (!grouped[rawName]) {
                grouped[rawName] = {
                    name: rawName,
                    rawName: rawName, 
                    avatar: data.avatar || '',
                    roles: []
                };
            }
            grouped[rawName].roles.push(role);
        });
        const finalArray = Object.values(grouped);
        finalArray.sort((a, b) => a.name.localeCompare(b.name));
        return finalArray;
    }

    async mount(params = {}) {
        this.isMounted = true;
        this.container.innerHTML = GroupTemplate.renderSkeletons();
        
        this.container.addEventListener('click', this.handleGlobalClick);
        
        try {
            const [students, staff] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getTeachers()
            ]);

            if (!this.isMounted) return;

            this.studentsData = students || [];
            
            if (staff && staff.administration) {
                this.adminData = this._processPersons(staff.administration);
            }
            if (staff && staff.teachers) {
                this.teachersData = this._processPersons(staff.teachers);
            }

            this.container.innerHTML = GroupTemplate.renderBaseUI(this.currentTab);
            this.renderList();

        } catch (error) {
            if (!this.isMounted) return;
            console.error('[GroupView] Ошибка:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки данных.</div>`;
        }
    }

    renderList() {
        if (!this.isMounted) return;
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
                const subText = st.nickname ? st.nickname : '';
                const tgLink = st.tg ? `@${st.tg}` : ''; 
                
                // Передаем st.id первым аргументом
                return GroupTemplate.renderPerson(st.id, st.name, subText, avatar, role, tgLink ? 'TG_BTN' : '');
            }).join('');
        } 
        else if (this.currentTab === 'teachers') {
            const totalTeachers = this.adminData.length + this.teachersData.length;
            statsContainer.innerHTML = GroupTemplate.renderStats('teachers', totalTeachers);

            const renderSection = (title, data) => {
                let sectionHtml = `<h3 class="group-list-header">${title}</h3>`;
                sectionHtml += data.map(person => {
                    const initial = person.name.charAt(0).toUpperCase();
                    const avatar = !person.avatar ? 
                        `<div class="person-avatar" style="background: ${UIUtils.getAvatarGradient(person.rawName)}">${initial}</div>` : 
                        `<div class="person-avatar" style="padding: 0; overflow: hidden;"><img src="${person.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${person.name}" loading="lazy" decoding="async"></div>`;
                    
                    const rolesHtml = person.roles.map(role => `<span class="person-badge teacher-subject">${role}</span>`).join('');
                    // Передаем rawName в качестве ID, чтобы можно было стилизовать и преподов
                    return GroupTemplate.renderPerson(person.rawName, person.name, rolesHtml, avatar);
                }).join('');
                return sectionHtml;
            };
            
            if (this.adminData.length > 0) html += renderSection('Администрация', this.adminData);
            if (this.teachersData.length > 0) html += renderSection('Преподавательский состав', this.teachersData);
        }

        listContainer.innerHTML = html || `<li class="placeholder-card" style="text-align:center;">Список пуст</li>`;
    }

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
            requestAnimationFrame(() => {
                if (!this.isMounted) return;
                wrapper.classList.add('fading');
                setTimeout(() => {
                    if (!this.isMounted) return;
                    this.renderList();
                    wrapper.classList.remove('fading');
                }, 200); 
            });
        }
    }

    unmount() {
        this.isMounted = false;
        this.container.removeEventListener('click', this.handleGlobalClick);
    } 
}