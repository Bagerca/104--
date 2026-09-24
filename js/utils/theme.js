/* =====================================================================
   FILE: js/utils/theme.js
   ОПТИМИЗАЦИЯ: Исправлен баг утечки контекста Canvas (партиклы больше не пропадают)
===================================================================== */
import { PrefsManager } from './prefs.js';

// --- ДВИЖОК ЧАСТИЦ CANVAS ---
class ParticleEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.theme = null; 
        this.isActive = false; // Флаг для защиты от зомби-процессов
        
        this.width = 0;
        this.height = 0;

        this.handleResize = this.handleResize.bind(this);
        this.loop = this.loop.bind(this);
    }

    init(themeId) {
        this.stop(); // Гарантированно убиваем старый цикл
        this.theme = themeId;
        this.isActive = true;
        
        let container = document.getElementById('seasonal-fx-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'seasonal-fx-container';
            document.body.appendChild(container);
        }
        
        // ВАЖНО: Мы больше не пересоздаем элемент <canvas> через innerHTML. 
        // Если его постоянно пересоздавать, браузер исчерпает лимит GPU-контекстов и снег исчезнет.
        this.canvas = document.getElementById('seasonal-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'seasonal-canvas';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            this.canvas.style.pointerEvents = 'none'; // Чтобы не мешал кликам
            container.appendChild(this.canvas);
            
            this.ctx = this.canvas.getContext('2d', { alpha: true });
        }
        
        this.canvas.style.display = 'block'; // Показываем, если был скрыт
        
        this.handleResize();
        window.addEventListener('resize', this.handleResize);

        // Создаем частицы
        const count = this.theme === 'new-year' ? 50 : 30;
        this.particles = []; // Очищаем массив
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(true));
        }

        this.loop();
    }

    createParticle(isInitial = false) {
        if (this.theme === 'new-year') {
            return {
                x: Math.random() * this.width,
                // При старте раскидываем снег по всему экрану, а новые снежинки появляются только сверху
                y: isInitial ? (Math.random() * this.height) : -10, 
                r: Math.random() * 2 + 1, 
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.5 + 0.3
            };
        } else {
            // Halloween
            return {
                x: Math.random() * this.width,
                y: isInitial ? (Math.random() * this.height) : (this.height + 10), 
                r: Math.random() * 2 + 1,
                speedY: -(Math.random() * 2 + 1),
                speedX: Math.random() * 2 - 1,
                opacity: Math.random(),
                life: Math.random() * 100 
            };
        }
    }

    handleResize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Установка width/height аппаратно очищает canvas, что нам и нужно
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    updateAndDraw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            if (this.theme === 'new-year') {
                p.y += p.speedY;
                p.x += Math.sin(p.y / 50) * 0.5 + p.speedX; 

                // Переиспользуем объект вместо создания нового (бережет память телефона)
                if (p.y > this.height + 10) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.fill();

            } else {
                p.y += p.speedY;
                p.x += Math.sin(p.life / 10) * p.speedX;
                p.life++;
                
                const currentOpacity = Math.abs(Math.sin(p.life / 10)) * p.opacity;

                if (p.y < -10) {
                    p.y = this.height + 10;
                    p.x = Math.random() * this.width;
                }

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#F86903';
                this.ctx.fillStyle = `rgba(248, 105, 3, ${currentOpacity})`;
                this.ctx.fill();
                this.ctx.shadowBlur = 0; 
            }
        }
    }

    loop() {
        if (!this.isActive || !this.ctx) return;
        this.updateAndDraw();
        this.animationId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('resize', this.handleResize);
        
        // Очищаем и скрываем канвас, но НЕ удаляем его из DOM!
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.canvas.style.display = 'none';
        }
        this.particles = [];
    }
}

const pEngine = new ParticleEngine();
// ------------------------------

export const ThemeManager = {
    storageKey: 'sh_theme', customStorageKey: 'sh_custom_theme',
    baseThemes: [
        { id: 'burgundy', name: 'Бордовая (Dark)', color: '#93002E', bg: '#151515' },
        { id: 'monochrome', name: 'Black & White', color: '#ffffff', bg: '#0a0a0a' },
        { id: 'light-pure', name: 'Светлая (Apple)', color: '#007AFF', bg: '#F2F2F7' },
        { id: 'electric-purple', name: 'Electric Purple', color: '#C200FB', bg: '#00120B' },
        { id: 'kiwi-night', name: 'Kiwi Night', color: '#89E900', bg: '#1A1A1A' },
        { id: 'neon-pink', name: 'Neon Pink', color: '#FF0055', bg: '#0D0303' },
        { id: 'factory-orange', name: 'Factory Orange', color: '#FF5E00', bg: '#1E2032' },
        { id: 'deep-blue', name: 'Deep Blue', color: '#2374E1', bg: '#02203c' }
    ],
    seasonalThemes: {
        'halloween': { id: 'halloween', name: 'Halloween', color: '#F86903', bg: '#110300', start: {m: 10, d: 24}, end: {m: 11, d: 7} },
        // Обновлены даты: с 1 декабря по 31 января
        'new-year': { id: 'new-year', name: 'Новый Год', color: '#00E5FF', bg: '#070B19', start: {m: 12, d: 1}, end: {m: 1, d: 31} }
    },
    icons: {
        'default': {
            'schedule': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
            'homework': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
            'group': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
            'events': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
        },
        'halloween': {
            'schedule': '<path d="M2 12h20M12 2v20M5 5l14 14M19 5L5 19"></path><circle cx="12" cy="12" r="7"></circle>', 
            'homework': '<path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>', 
            'group': '<circle cx="12" cy="10" r="7"></circle><path d="M9 17v4H15v-4"></path><path d="M9 12h.01M15 12h.01"></path>', 
            'events': '<path d="M2 12l5-3 5 3 5-3 5 3v2l-5-2-5 2-5-2-5 2z"></path><circle cx="12" cy="8" r="2"></circle>' 
        },
        'new-year': {
            'schedule': '<rect x="3" y="8" width="18" height="14" rx="2"></rect><path d="M12 5H8a2 2 0 0 0 0 4h4z"></path><path d="M12 5h4a2 2 0 0 1 0 4h-4z"></path><line x1="12" y1="8" x2="12" y2="22"></line>', 
            'homework': '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>', 
            'group': '<circle cx="12" cy="15" r="6"></circle><circle cx="12" cy="6" r="4"></circle><line x1="12" y1="13" x2="12" y2="13.01"></line><line x1="12" y1="17" x2="12" y2="17.01"></line>', 
            'events': '<line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line>' 
        }
    },

    getCurrentSeason() {
        const d = new Date();
        const current = (d.getMonth() + 1) * 100 + d.getDate(); 
        for (const [key, season] of Object.entries(this.seasonalThemes)) {
            const s = season.start.m * 100 + season.start.d, e = season.end.m * 100 + season.end.d;
            if (s <= e) { if (current >= s && current <= e) return key; } 
            else { if (current >= s || current <= e) return key; }
        }
        return null;
    },

    hexToRgbA(hex, alpha) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return `rgba(255, 255, 255, ${alpha})`;
    },

    getContrastColor(hex) {
        if (hex.indexOf('#') === 0) hex = hex.slice(1);
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length !== 6) return '#ffffff';
        const yiq = ((parseInt(hex.slice(0, 2), 16) * 299) + (parseInt(hex.slice(2, 4), 16) * 587) + (parseInt(hex.slice(4, 6), 16) * 114)) / 1000;
        return (yiq >= 128) ? '#151515' : '#ffffff';
    },

    generateFavicon(accentHex, bgHex) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bgHex}"/><circle cx="256" cy="256" r="180" fill="${accentHex}" opacity="0.8"/><path d="M256 24 L448 109 L448 311 C448 417 256 498 256 498 C256 498 64 417 64 311 L64 109 Z" fill="${bgHex}" stroke="${accentHex}" stroke-width="24" stroke-linejoin="round"/><text x="256" y="405" font-family="system-ui, sans-serif" font-weight="900" font-size="420" fill="#fff" text-anchor="middle">4</text></svg>`;
        const encodedSvg = encodeURIComponent(svg.trim());
        let link = document.querySelector("link[rel*='icon']");
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.type = 'image/svg+xml'; link.href = `data:image/svg+xml,${encodedSvg}`;
    },

    init() {
        const currentSeason = this.getCurrentSeason();
        const savedThemeId = localStorage.getItem(this.storageKey);
        if (currentSeason) {
            const appliedKey = `sh_season_applied_${currentSeason}_${new Date().getFullYear()}`;
            if (!localStorage.getItem(appliedKey)) {
                localStorage.setItem(appliedKey, 'true');
                this.setTheme(currentSeason);
                return;
            }
        } 
        this.setTheme(savedThemeId || 'burgundy');
    },

    setTheme(themeId) {
        const root = document.documentElement;
        if (themeId === 'custom') {
            const customData = this.getCustomTheme();
            root.removeAttribute('data-theme');
            root.style.setProperty('--theme-bg-main', customData.bg);
            root.style.setProperty('--theme-bg-secondary', customData.bg); 
            root.style.setProperty('--theme-accent', customData.accent);
            root.style.setProperty('--theme-accent-glow', this.hexToRgbA(customData.accent, 0.4));
            root.style.setProperty('--theme-accent-soft', this.hexToRgbA(customData.accent, 0.15));
            root.style.setProperty('--theme-accent-text', customData.accent);
            root.style.setProperty('--text-on-accent', this.getContrastColor(customData.accent));
        } else {
            root.style.cssText = ''; 
            const tObj = this.getThemes().find(t => t.id === themeId) || this.baseThemes[0];
            root.setAttribute('data-theme', tObj.id);
            themeId = tObj.id; 
        }
        localStorage.setItem(this.storageKey, themeId);
        requestAnimationFrame(() => {
            const computedStyle = getComputedStyle(root);
            const actualBg = computedStyle.getPropertyValue('--theme-bg-main').trim();
            const actualAccent = computedStyle.getPropertyValue('--theme-accent').trim();
            this.updateMetaColor(actualBg);
            this.generateFavicon(actualAccent, actualBg);
        });
        this.applySeasonalEffects(themeId);
    },

    applySeasonalEffects(themeId) {
        const prefs = PrefsManager.getPrefs();
        
        // Запуск Canvas движка, если включены партиклы и тема подходящая
        if (prefs.particles && (themeId === 'halloween' || themeId === 'new-year')) {
            pEngine.init(themeId);
        } else {
            pEngine.stop();
        }

        const iconSet = this.icons[themeId] ? this.icons[themeId] : this.icons['default'];
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            const href = item.getAttribute('href').slice(2); 
            const svgEl = item.querySelector('svg');
            if (svgEl && iconSet[href]) svgEl.innerHTML = iconSet[href];
        });
    },

    updateMetaColor(colorHex) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) metaThemeColor.setAttribute('content', colorHex);
    },
    
    saveCustomTheme(bgHex, accentHex) {
        localStorage.setItem(this.customStorageKey, JSON.stringify({ bg: bgHex, accent: accentHex }));
        this.setTheme('custom');
    },
    
    getCustomTheme() { return JSON.parse(localStorage.getItem(this.customStorageKey) || '{"bg":"#151515", "accent":"#ffffff"}'); },
    getCurrent() { return localStorage.getItem(this.storageKey) || 'burgundy'; },
    
    getThemes() {
        let available = [...this.baseThemes];
        for (const key in this.seasonalThemes) {
            if (PrefsManager.isAdmin() || this.getCurrentSeason() === key) available.push(this.seasonalThemes[key]);
        }
        return available;
    }
};