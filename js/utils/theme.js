/* =====================================================================
   FILE: js/utils/theme.js
   ОПТИМИЗАЦИЯ: SVG перенесены в глобальный реестр (icons.js)
===================================================================== */
import { Store } from '../store.js';
import { getIcon } from './icons.js';

// --- ДВИЖОК ЧАСТИЦ CANVAS ---
class ParticleEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.theme = null; 
        this.isActive = false; 
        
        this.width = 0;
        this.height = 0;

        this.handleResize = this.handleResize.bind(this);
        this.loop = this.loop.bind(this);
    }

    init(themeId) {
        this.stop(); 
        this.theme = themeId;
        this.isActive = true;
        
        let container = document.getElementById('seasonal-fx-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'seasonal-fx-container';
            document.body.appendChild(container);
        }
        
        this.canvas = document.getElementById('seasonal-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'seasonal-canvas';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            this.canvas.style.pointerEvents = 'none';
            container.appendChild(this.canvas);
            
            this.ctx = this.canvas.getContext('2d', { alpha: true });
        }
        
        this.canvas.style.display = 'block'; 
        
        this.handleResize();
        window.addEventListener('resize', this.handleResize);

        const count = this.theme === 'new-year' ? 50 : 30;
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(true));
        }

        this.loop();
    }

    createParticle(isInitial = false) {
        if (this.theme === 'new-year') {
            return {
                x: Math.random() * this.width,
                y: isInitial ? (Math.random() * this.height) : -10, 
                r: Math.random() * 2 + 1, 
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.5 + 0.3
            };
        } else {
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
        'new-year': { id: 'new-year', name: 'Новый Год', color: '#00E5FF', bg: '#070B19', start: {m: 12, d: 1}, end: {m: 1, d: 31} }
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
        // Забираем настройку частиц из Store, если он готов
        const prefs = Store.state?.prefs || JSON.parse(localStorage.getItem('sh_preferences') || '{}');
        const particlesEnabled = prefs.particles !== false; // По дефолту включены
        
        if (particlesEnabled && (themeId === 'halloween' || themeId === 'new-year')) {
            pEngine.init(themeId);
        } else {
            pEngine.stop();
        }

        const isSpecial = themeId === 'halloween' || themeId === 'new-year';
        
        // Подмена иконок в нижней панели (обращение к icons.js)
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            const href = item.getAttribute('href').slice(2); 
            const iconKey = isSpecial ? `nav-${href}-${themeId}` : `nav-${href}`;
            const svgHtml = getIcon(iconKey, { size: 24 });
            
            const existingSvg = item.querySelector('svg');
            if (existingSvg && svgHtml) {
                existingSvg.outerHTML = svgHtml;
            }
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
        // Проверка режима разработчика
        const isAdm = localStorage.getItem('sh_admin_mode') === 'true' || sessionStorage.getItem('sh_temp_admin') === 'true';
        for (const key in this.seasonalThemes) {
            if (isAdm || this.getCurrentSeason() === key) available.push(this.seasonalThemes[key]);
        }
        return available;
    }
};