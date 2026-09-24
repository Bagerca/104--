import { ThemeManager } from '../utils/theme.js';
import { PrefsManager } from '../utils/prefs.js';
import { Modal } from '../components/Modal.js';
import { SettingsTemplate } from '../templates/SettingsTemplate.js';

export class SettingsView {
    constructor(container) {
        this.container = container;
        this.adminTaps = 0;
        this.adminTapTimeout = null;
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    getSubgroupText(val) {
        if (val === '1') return '1 подгруппа';
        if (val === '2') return '2 подгруппа';
        return 'Обе (Показывать всё)';
    }

    handleDocumentClick(e) {
        const wrapper = document.getElementById('subgroup-wrapper');
        if (wrapper && !wrapper.contains(e.target)) wrapper.classList.remove('open');
    }

    async mount() {
        const currentPrefs = PrefsManager.getPrefs(); 
        const currentTheme = ThemeManager.getCurrent();
        const hasWp = await PrefsManager.hasWallpaper(); // Асинхронно
        
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
        
        this.bindEvents(currentPrefs);
        this.initDesktopScroll();
        document.addEventListener('click', this.handleDocumentClick);
    }

    bindEvents(currentPrefs) {
        document.getElementById('settings-back-btn')?.addEventListener('click', () => {
            PrefsManager.vibrate();
            if (window.history.length > 1) window.history.back();
            else window.location.hash = '#/schedule';
        });

        const swatchContainers = this.container.querySelectorAll('.theme-swatch-container');
        const customDialog = document.getElementById('custom-theme-dialog');

        swatchContainers.forEach(container => {
            container.addEventListener('click', (e) => {
                if (this.isDragging) return;
                const selectedId = e.currentTarget.getAttribute('data-id');
                PrefsManager.vibrate();

                if (selectedId === 'custom') {
                    customDialog.showModal();
                } else {
                    ThemeManager.setTheme(selectedId);
                    swatchContainers.forEach(c => c.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    this.mount(); 
                }
            });
        });

        document.getElementById('btn-cancel-custom').addEventListener('click', () => {
            PrefsManager.vibrate(); customDialog.close();
        });
        document.getElementById('btn-save-custom').addEventListener('click', () => {
            PrefsManager.vibrate();
            ThemeManager.saveCustomTheme(document.getElementById('picker-bg').value, document.getElementById('picker-accent').value);
            customDialog.close();
            this.mount(); 
        });

        const navDialog = document.getElementById('nav-order-dialog');
        let tempNavOrder = [...currentPrefs.navOrder];
        const navNames = { 'schedule': 'Расписание', 'homework': 'Домашка', 'group': 'Группа', 'events': 'Ивенты' };

        const refreshNavModal = () => {
            const list = document.getElementById('nav-order-list');
            list.innerHTML = SettingsTemplate.renderNavList(tempNavOrder, navNames);
            list.querySelectorAll('.nav-move-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    const dir = parseInt(btn.dataset.dir);
                    if (idx + dir >= 0 && idx + dir < tempNavOrder.length) {
                        PrefsManager.vibrate(10);
                        [tempNavOrder[idx], tempNavOrder[idx+dir]] = [tempNavOrder[idx+dir], tempNavOrder[idx]];
                        refreshNavModal();
                    }
                });
            });
        };

        document.getElementById('btn-open-nav-order').addEventListener('click', () => {
            PrefsManager.vibrate(10);
            tempNavOrder = [...currentPrefs.navOrder];
            refreshNavModal();
            navDialog.showModal();
        });
        document.getElementById('btn-save-nav').addEventListener('click', () => {
            PrefsManager.vibrate(20);
            PrefsManager.updatePref('navOrder', tempNavOrder);
            PrefsManager.applySettingsToDOM(); 
            navDialog.close();
        });

        const wrapper = document.getElementById('subgroup-wrapper');
        const btn = document.getElementById('subgroup-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            PrefsManager.vibrate(10);
            wrapper.classList.toggle('open');
        });

        wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.addEventListener('click', () => {
                PrefsManager.vibrate();
                PrefsManager.updatePref('subgroup', opt.getAttribute('data-value'));
                this.mount(); 
            });
        });

        document.getElementById('upload-wp')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) PrefsManager.saveWallpaper(file, (success) => { if (success) this.mount(); });
        });
        document.getElementById('btn-clear-wp')?.addEventListener('click', () => {
            PrefsManager.vibrate(); PrefsManager.clearWallpaper(); this.mount();
        });

        const bindToggle = (wrapperId, toggleId, prefKey, onToggle) => {
            document.getElementById(wrapperId)?.addEventListener('click', async () => {
                PrefsManager.vibrate();
                const toggle = document.getElementById(toggleId);
                
                if (prefKey === 'notifications' && !toggle.classList.contains('active')) {
                    const granted = await PrefsManager.requestNotificationPermission();
                    if (!granted) {
                        Modal.showAlert('Уведомления заблокированы', 'Разрешите браузеру отправлять уведомления в системных настройках телефона.', 'warning');
                        return;
                    }
                }
                const isNowEnabled = toggle.classList.toggle('active');
                PrefsManager.updatePref(prefKey, isNowEnabled);
                if (onToggle) onToggle(isNowEnabled);
            });
        };

        bindToggle('toggle-haptic-wrapper', 'toggle-haptic', 'haptic', (val) => { if (val && navigator.vibrate) navigator.vibrate(20); });
        bindToggle('toggle-power-wrapper', 'toggle-power', 'powerSave', () => PrefsManager.applySettingsToDOM());
        bindToggle('toggle-particles-wrapper', 'toggle-particles', 'particles', () => ThemeManager.applySeasonalEffects(ThemeManager.getCurrent()));
        bindToggle('toggle-notif-wrapper', 'toggle-notif', 'notifications');

        document.getElementById('btn-reset-hw').addEventListener('click', () => {
            PrefsManager.vibrate();
            if (confirm('Удалить галочки со всех заданий?')) {
                localStorage.removeItem('sh_homework_state');
                const span = document.querySelector('#btn-reset-hw span');
                span.textContent = 'Прогресс сброшен ✓';
                setTimeout(() => span.textContent = 'Сбросить прогресс домашки', 3000);
            }
        });
        
        document.getElementById('btn-clear-cache').addEventListener('click', () => {
            PrefsManager.vibrate();
            if (confirm('Очистить кэш и перезагрузить?')) {
                if ('caches' in window) {
                    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))).then(() => window.location.reload(true)));
                } else window.location.reload(true);
            }
        });

        document.getElementById('app-version').addEventListener('click', () => {
            this.adminTaps++;
            if (this.adminTaps === 1) this.adminTapTimeout = setTimeout(() => this.adminTaps = 0, 3000);
            if (this.adminTaps >= 5) {
                clearTimeout(this.adminTapTimeout); this.adminTaps = 0; PrefsManager.vibrate(50);
                const isAdm = PrefsManager.toggleAdmin();
                Modal.showAlert(
                    isAdm ? 'Режим разработчика ВКЛЮЧЕН' : 'Режим разработчика ВЫКЛЮЧЕН',
                    isAdm ? 'Открыт доступ к скрытым функциям и сезонным темам.' : 'Стандартный вид.',
                    'admin', () => this.mount()
                );
            }
        });
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

    unmount() {
        if (this.adminTapTimeout) clearTimeout(this.adminTapTimeout);
        document.removeEventListener('click', this.handleDocumentClick);
    }
}