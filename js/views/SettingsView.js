/* =====================================================================
   FILE: js/views/SettingsView.js
===================================================================== */
import { ThemeManager } from '../utils/theme.js';
import { PrefsManager } from '../utils/prefs.js';
import { Modal } from '../components/Modal.js';
import { SettingsTemplate } from '../templates/SettingsTemplate.js';
import { Store } from '../store.js';

export class SettingsView {
    constructor(container) {
        this.container = container;
        this.adminTaps = 0;
        this.adminTapTimeout = null;
        this.isMounted = false;
        this.currentParams = {};
        
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleGlobalChange = this.handleGlobalChange.bind(this);
    }

    getSubgroupText(val) {
        if (val === '1') return '1 подгруппа';
        if (val === '2') return '2 подгруппа';
        return 'Обе (Показывать всё)';
    }

    async mount(params = {}) {
        this.isMounted = true;
        this.currentParams = params;
        
        const currentPrefs = Store.getState().prefs; 
        const currentTheme = ThemeManager.getCurrent();
        const hasWp = await PrefsManager.hasWallpaper(); 
        
        if (!this.isMounted) return;
        
        const templateData = {
            prefs: currentPrefs,
            themes: ThemeManager.getThemes(),
            currentTheme: currentTheme,
            customData: ThemeManager.getCustomTheme(),
            hasWallpaper: hasWp,
            isSeasonalActive: ['halloween', 'new-year'].includes(currentTheme),
            currentYear: new Date().getFullYear(),
            subgroupText: this.getSubgroupText(currentPrefs.subgroup),
            notifDenied: Notification.permission === 'denied'
        };

        this.container.innerHTML = SettingsTemplate.renderMain(templateData);
        
        this.container.addEventListener('click', this.handleGlobalClick);
        this.container.addEventListener('change', this.handleGlobalChange);
        
        this.initDesktopScroll();
        this.handleModalState();
    }

    async update(params = {}) {
        this.currentParams = params;
        this.handleModalState();
    }

    unmount() {
        this.isMounted = false;
        if (this.adminTapTimeout) clearTimeout(this.adminTapTimeout);
        this.container.removeEventListener('click', this.handleGlobalClick);
        this.container.removeEventListener('change', this.handleGlobalChange);
    }

    handleModalState() {
        if (!this.isMounted) return;
        
        const customDialog = document.getElementById('custom-theme-dialog');
        const navDialog = document.getElementById('nav-order-dialog');
        
        if (!customDialog || !navDialog) return;

        if (this.currentParams.modal === 'custom-theme') {
            if (!customDialog.open) customDialog.showModal();
            if (navDialog.open) navDialog.close();
        } else if (this.currentParams.modal === 'nav-order') {
            if (!navDialog.open) {
                this.refreshNavModal();
                navDialog.showModal();
            }
            if (customDialog.open) customDialog.close();
        } else {
            if (customDialog.open) customDialog.close();
            if (navDialog.open) navDialog.close();
        }
    }

    handleGlobalChange(e) {
        if (e.target.id === 'upload-wp') {
            const file = e.target.files[0];
            if (file) PrefsManager.saveWallpaper(file, (success) => { 
                if (success && this.isMounted) this.mount(this.currentParams); 
            });
        }
    }

    async handleGlobalClick(e) {
        const subgroupWrapper = document.getElementById('subgroup-wrapper');
        if (subgroupWrapper && !subgroupWrapper.contains(e.target)) {
            subgroupWrapper.classList.remove('open');
        }

        // ФИКС: Теперь кнопка честно откатывает историю назад, не создавая циклов
        if (e.target.closest('#settings-back-btn')) {
            PrefsManager.vibrate();
            window.history.back();
            return;
        }

        const themeContainer = e.target.closest('.theme-swatch-container');
        if (themeContainer) {
            if (this.isDragging) return;
            const selectedId = themeContainer.getAttribute('data-id');
            PrefsManager.vibrate();

            if (selectedId === 'custom') {
                window.location.hash = '#/settings?modal=custom-theme';
            } else {
                ThemeManager.setTheme(selectedId);
                this.mount(this.currentParams); 
            }
            return;
        }

        if (e.target.closest('#btn-cancel-custom') || (e.target.tagName === 'DIALOG' && e.target.id === 'custom-theme-dialog')) {
            PrefsManager.vibrate(); 
            window.history.back();
            return;
        }

        if (e.target.closest('#btn-save-custom')) {
            PrefsManager.vibrate();
            ThemeManager.saveCustomTheme(document.getElementById('picker-bg').value, document.getElementById('picker-accent').value);
            window.history.back(); 
            setTimeout(() => this.mount(this.currentParams), 100); 
            return;
        }

        if (e.target.closest('#btn-open-nav-order')) {
            PrefsManager.vibrate(10);
            const validNavs = ['schedule', 'homework', 'group', 'events'];
            this.tempNavOrder = Store.getState().prefs.navOrder.filter(id => validNavs.includes(id));
            if (this.tempNavOrder.length === 0) this.tempNavOrder = [...validNavs];
            
            window.location.hash = '#/settings?modal=nav-order';
            return;
        }

        if (e.target.closest('#btn-save-nav')) {
            PrefsManager.vibrate(20);
            PrefsManager.updatePref('navOrder', this.tempNavOrder);
            PrefsManager.applySettingsToDOM(); 
            window.history.back();
            return;
        }

        const subgroupBtn = e.target.closest('#subgroup-btn');
        if (subgroupBtn) {
            e.stopPropagation(); 
            PrefsManager.vibrate(10);
            subgroupWrapper.classList.toggle('open');
            return;
        }

        const subgroupOpt = e.target.closest('.custom-select-option');
        if (subgroupOpt) {
            PrefsManager.vibrate();
            const val = subgroupOpt.getAttribute('data-value');
            PrefsManager.updatePref('subgroup', val);
            this.mount(this.currentParams); 
            return;
        }

        if (e.target.closest('#btn-clear-wp')) {
            PrefsManager.vibrate(); 
            PrefsManager.clearWallpaper(); 
            this.mount(this.currentParams);
            return;
        }

        const toggleWrapper = e.target.closest('.settings-list-item[id^="toggle-"]');
        if (toggleWrapper) {
            PrefsManager.vibrate();
            const wrapperId = toggleWrapper.id;
            
            if (wrapperId === 'toggle-haptic-wrapper') {
                const toggle = document.getElementById('toggle-haptic');
                const isNowEnabled = toggle.classList.toggle('active');
                PrefsManager.updatePref('haptic', isNowEnabled);
                if (isNowEnabled && navigator.vibrate) navigator.vibrate(20);
            } 
            else if (wrapperId === 'toggle-power-wrapper') {
                const toggle = document.getElementById('toggle-power');
                const isNowEnabled = toggle.classList.toggle('active');
                PrefsManager.updatePref('powerSave', isNowEnabled);
                PrefsManager.applySettingsToDOM();
            }
            else if (wrapperId === 'toggle-particles-wrapper') {
                const toggle = document.getElementById('toggle-particles');
                const isNowEnabled = toggle.classList.toggle('active');
                PrefsManager.updatePref('particles', isNowEnabled);
                ThemeManager.applySeasonalEffects(ThemeManager.getCurrent());
            }
            else if (wrapperId === 'toggle-notif-wrapper') {
                const toggle = document.getElementById('toggle-notif');
                if (!toggle.classList.contains('active')) {
                    const granted = await PrefsManager.requestNotificationPermission();
                    if (!this.isMounted) return;
                    if (!granted) {
                        Modal.showAlert('Уведомления заблокированы', 'Разрешите браузеру отправлять уведомления в системных настройках телефона.', 'warning');
                        return;
                    }
                }
                const isNowEnabled = toggle.classList.toggle('active');
                PrefsManager.updatePref('notifications', isNowEnabled);
            }
            return;
        }

        if (e.target.closest('#btn-reset-hw')) {
            PrefsManager.vibrate();
            if (confirm('Удалить галочки со всех заданий?')) {
                localStorage.removeItem('sh_homework_state');
                const span = document.querySelector('#btn-reset-hw span');
                span.textContent = 'Прогресс сброшен ✓';
                setTimeout(() => { if(this.isMounted) span.textContent = 'Сбросить прогресс домашки'; }, 3000);
            }
            return;
        }

        if (e.target.closest('#btn-clear-cache')) {
            PrefsManager.vibrate();
            if (confirm('Очистить кэш и перезагрузить?')) {
                if ('caches' in window) {
                    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))).then(() => window.location.reload(true)));
                } else window.location.reload(true);
            }
            return;
        }

        if (e.target.closest('#app-version')) {
            this.adminTaps++;
            if (this.adminTaps === 1) this.adminTapTimeout = setTimeout(() => this.adminTaps = 0, 3000);
            if (this.adminTaps >= 5) {
                clearTimeout(this.adminTapTimeout); this.adminTaps = 0; PrefsManager.vibrate(50);
                const isAdm = PrefsManager.toggleAdmin();
                Modal.showAlert(
                    isAdm ? 'Режим разработчика ВКЛЮЧЕН' : 'Режим разработчика ВЫКЛЮЧЕН',
                    isAdm ? 'Открыт доступ к скрытым функциям и сезонным темам.' : 'Стандартный вид.',
                    'admin', () => { if(this.isMounted) this.mount(this.currentParams); }
                );
            }
            return;
        }
    }

    refreshNavModal() {
        const list = document.getElementById('nav-order-list');
        if (!list) return;
        const navNames = { 'schedule': 'Расписание', 'homework': 'Домашка', 'group': 'Группа', 'events': 'Ивенты' };
        list.innerHTML = SettingsTemplate.renderNavList(this.tempNavOrder, navNames);
        this.initDragDrop(list); 
    }

    initDragDrop(listContainer) {
        let activeItem = null;
        let clone = null;
        let offsetX = 0;
        let offsetY = 0;

        const getEvent = (e) => e.touches ? e.touches[0] : e;

        const onStart = (e) => {
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            
            activeItem = e.target.closest('.nav-reorder-item');
            if (!activeItem) return;

            e.preventDefault(); 
            if (navigator.vibrate) navigator.vibrate(15);

            const evt = getEvent(e);
            const rect = activeItem.getBoundingClientRect();
            
            offsetX = evt.clientX - rect.left;
            offsetY = evt.clientY - rect.top;

            clone = activeItem.cloneNode(true);
            clone.classList.add('drag-clone');
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.left = `${evt.clientX - offsetX}px`;
            clone.style.top = `${evt.clientY - offsetY}px`;
            
            document.body.appendChild(clone);

            activeItem.classList.add('drag-placeholder');

            document.addEventListener('mousemove', onMove, { passive: false });
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
            document.addEventListener('touchcancel', onEnd); 
        };

        const onMove = (e) => {
            if (!activeItem || !clone) return;
            e.preventDefault(); 
            
            const evt = getEvent(e);
            
            clone.style.left = `${evt.clientX - offsetX}px`;
            clone.style.top = `${evt.clientY - offsetY}px`;

            const hoveredEl = document.elementFromPoint(evt.clientX, evt.clientY);
            if (!hoveredEl) return;

            const targetItem = hoveredEl.closest('.nav-reorder-item:not(.drag-placeholder)');
            
            if (targetItem && targetItem.parentNode === listContainer) {
                const targetRect = targetItem.getBoundingClientRect();
                const targetCenter = targetRect.top + (targetRect.height / 2);
                
                if (evt.clientY < targetCenter) {
                    listContainer.insertBefore(activeItem, targetItem);
                } else {
                    listContainer.insertBefore(activeItem, targetItem.nextSibling);
                }
                if (navigator.vibrate) navigator.vibrate(5);
            }
        };

        const onEnd = () => {
            if (!activeItem) return;
            if (clone) clone.remove();
            clone = null;

            activeItem.classList.remove('drag-placeholder');
            activeItem = null;

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('touchcancel', onEnd);

            const newOrder = [...listContainer.querySelectorAll('.nav-reorder-item')].map(el => el.dataset.id);
            this.tempNavOrder = newOrder;
            this.refreshNavModal(); 
        };

        listContainer.removeEventListener('mousedown', onStart);
        listContainer.removeEventListener('touchstart', onStart);
        
        listContainer.addEventListener('mousedown', onStart);
        listContainer.addEventListener('touchstart', onStart, { passive: false });
    }

    initDesktopScroll() {
        const slider = document.getElementById('theme-scroll-wrapper');
        if (!slider) return;
        let isDown = false, startX, scrollLeft;
        this.isDragging = false; 

        slider.addEventListener('mousedown', (e) => { isDown = true; this.isDragging = false; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
        slider.addEventListener('mouseleave', () => { isDown = false; });
        slider.addEventListener('mouseup', () => { isDown = false; });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const walk = (e.pageX - slider.offsetLeft - startX) * 2; 
            if (Math.abs(walk) > 5) this.isDragging = true;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
}