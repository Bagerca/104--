// Простая асинхронная обертка для IndexedDB
const idb = {
    getDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('StudentHubDB', 1);
            request.onupgradeneeded = e => e.target.result.createObjectStore('store');
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
    },
    async set(key, value) {
        const db = await this.getDb();
        db.transaction('store', 'readwrite').objectStore('store').put(value, key);
    },
    async get(key) {
        const db = await this.getDb();
        return new Promise(resolve => {
            const req = db.transaction('store').objectStore('store').get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    },
    async del(key) {
        const db = await this.getDb();
        db.transaction('store', 'readwrite').objectStore('store').delete(key);
    }
};

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

    enableTempAdmin() {
        sessionStorage.setItem('sh_temp_admin', 'true');
    },

    isAdmin() {
        const isPerm = localStorage.getItem(this.adminKey) === 'true';
        const isTemp = sessionStorage.getItem('sh_temp_admin') === 'true';
        return isPerm || isTemp;
    },

    toggleAdmin() {
        const isPerm = localStorage.getItem(this.adminKey) === 'true';
        localStorage.setItem(this.adminKey, !isPerm ? 'true' : 'false');
        return !isPerm;
    },

    vibrate(ms = 20) {
        const prefs = this.getPrefs();
        if (prefs.haptic && navigator.vibrate) navigator.vibrate(ms);
    },

    async hasWallpaper() {
        const val = await idb.get(this.wallpaperKey);
        return !!val;
    },

    async saveWallpaper(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
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
                    await idb.set(this.wallpaperKey, base64);
                    this.applySettingsToDOM();
                    callback(true);
                } catch (err) {
                    console.error('[Prefs] Ошибка сохранения обоев:', err);
                    await this.clearWallpaper();
                    alert('Ошибка сохранения обоев. Возможно, недостаточно памяти.');
                    callback(false);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    async clearWallpaper() {
        await idb.del(this.wallpaperKey);
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

    async applySettingsToDOM() {
        const prefs = this.getPrefs();
        const body = document.body;
        
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href').replace('#/', '');
            const index = prefs.navOrder.indexOf(href);
            if(index !== -1) item.style.order = index;
        });

        if (prefs.powerSave) body.classList.add('power-save-mode');
        else body.classList.remove('power-save-mode');

        let wpImg = document.getElementById('app-wallpaper');
        if (!wpImg) {
            wpImg = document.createElement('img');
            wpImg.id = 'app-wallpaper';
            document.body.appendChild(wpImg);
        }

        const savedWp = await idb.get(this.wallpaperKey);
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