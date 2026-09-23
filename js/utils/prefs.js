/* =====================================================================
   FILE: js/utils/prefs.js
   ОПТИМИЗАЦИЯ: Добавлена система временного доступа (Session Admin)
===================================================================== */
export const PrefsManager = {
    storageKey: 'sh_preferences',
    adminKey: 'sh_admin_mode',
    wallpaperKey: 'sh_wallpaper',
    
    defaults: {
        haptic: true,
        particles: true,
        subgroup: 'all',
        navOrder: ['schedule', 'homework', 'group', 'events'],
        powerSave: false,
        notifications: false
    },

    getPrefs() {
        const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        return { ...this.defaults, ...saved };
    },

    savePrefs(newPrefs) {
        localStorage.setItem(this.storageKey, JSON.stringify(newPrefs));
    },

    updatePref(key, value) {
        const prefs = this.getPrefs();
        prefs[key] = value;
        this.savePrefs(prefs);
    },

    // Включаем временную админку (живет до закрытия вкладки)
    enableTempAdmin() {
        sessionStorage.setItem('sh_temp_admin', 'true');
    },

    // Админ ли пользователь? (Либо навсегда через 5 тапов, либо временно по ссылке)
    isAdmin() {
        const isPerm = localStorage.getItem(this.adminKey) === 'true';
        const isTemp = sessionStorage.getItem('sh_temp_admin') === 'true';
        return isPerm || isTemp;
    },

    // 5 тапов меняют только постоянную настройку
    toggleAdmin() {
        const isPerm = localStorage.getItem(this.adminKey) === 'true';
        localStorage.setItem(this.adminKey, !isPerm ? 'true' : 'false');
        return !isPerm;
    },

    vibrate(ms = 20) {
        const prefs = this.getPrefs();
        if (prefs.haptic && navigator.vibrate) {
            navigator.vibrate(ms);
        }
    },

    saveWallpaper(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 1080; 
                let width = img.width, height = img.height;
                
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const base64 = canvas.toDataURL('image/webp', 0.6); 
                try {
                    localStorage.setItem(this.wallpaperKey, base64);
                    this.applySettingsToDOM();
                    callback(true);
                } catch (err) {
                    console.error('[Prefs] Ошибка сохранения обоев:', err);
                    this.clearWallpaper();
                    alert('Файл слишком большой или память браузера переполнена.');
                    callback(false);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    clearWallpaper() {
        localStorage.removeItem(this.wallpaperKey);
        this.applySettingsToDOM();
    },

    async requestNotificationPermission() {
        if (!('Notification' in window)) return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    sendLocalNotification(title, body) {
        const prefs = this.getPrefs();
        if (!prefs.notifications || Notification.permission !== 'granted') return;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                    body: body,
                    icon: 'icons/icon.svg',
                    badge: 'icons/icon-mobile.svg',
                    vibrate: [200, 100, 200]
                });
            });
        }
    },

    applySettingsToDOM() {
        const prefs = this.getPrefs();
        const body = document.body;
        
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href').replace('#/', '');
            const index = prefs.navOrder.indexOf(href);
            if(index !== -1) {
                item.style.order = index;
            }
        });

        if (prefs.powerSave) body.classList.add('power-save-mode');
        else body.classList.remove('power-save-mode');

        let wpImg = document.getElementById('app-wallpaper');
        if (!wpImg) {
            wpImg = document.createElement('img');
            wpImg.id = 'app-wallpaper';
            document.body.appendChild(wpImg);
        }

        const savedWp = localStorage.getItem(this.wallpaperKey);
        if (savedWp && !prefs.powerSave) { 
            wpImg.src = savedWp;
            wpImg.style.opacity = '1';
            body.classList.add('has-wallpaper');
        } else {
            wpImg.style.opacity = '0';
            body.classList.remove('has-wallpaper');
        }
    }
};