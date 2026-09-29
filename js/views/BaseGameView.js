/* =====================================================================
   FILE: js/views/BaseGameView.js
===================================================================== */
import { GameShellTemplate } from '../templates/GameShellTemplate.js';
import { PrefsManager } from '../utils/prefs.js';

export class BaseGameView {
    constructor(id, title, hint, container, options = {}) {
        this.id = id;
        this.title = title;
        this.hint = hint;
        this.container = container;
        
        this.options = {
            isSquare: false,
            noPadding: true,
            useGameLoop: true, 
            ...options
        };

        this.isMounted = false;
        this.isPlaying = false;
        
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem(`sh_${this.id}_best`)) || 0;
        
        this.animationId = null;
        this.lastTime = 0;
        this.colors = {}; 

        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.preventScroll = (e) => e.preventDefault();
        this.coreLoop = this.coreLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    getInnerHtml() { return ''; }
    onGameInit() {}
    onGameStart() {}
    onGameUpdate(deltaTime) {}
    onGameDraw() {}
    onSwipe(direction) {} 
    onTap() {}
    onKeyPress(key) {}

    async mount() {
        this.isMounted = true;
        document.getElementById('page-title').textContent = this.title;
        
        this.container.innerHTML = GameShellTemplate.renderUI({
            title: this.title,
            bestScore: this.bestScore,
            hint: this.hint,
            innerHTML: this.getInnerHtml(),
            isSquare: this.options.isSquare,
            noPadding: this.options.noPadding
        });
        
        this.area = document.getElementById('game-area');
        
        this.cacheColors();
        this.onGameInit();
        this.initTouchControls();

        this.container.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeydown);
        window.addEventListener('resize', this.handleResize);
        
        this.container.addEventListener('touchmove', this.preventScroll, { passive: false });
    }

    unmount() {
        this.isMounted = false;
        this.stopGame();
        this.container.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('touchmove', this.preventScroll);
    }

    cacheColors() {
        const root = getComputedStyle(document.documentElement);
        this.colors = {
            accent: root.getPropertyValue('--theme-accent').trim() || '#FF0055',
            accentSoft: root.getPropertyValue('--theme-accent-soft').trim() || 'rgba(255,255,255,0.3)',
            text: root.getPropertyValue('--text-primary').trim() || '#fff'
        };
    }

    handleResize() {
        if (!this.isMounted) return;
        try {
            this.onGameDraw(); 
        } catch (e) {
            // Тихо гасим ошибку, чтобы она не роняла роутер
            console.warn(`[GameEngine] Пропуск перерисовки при ресайзе (${this.id}):`, e.message);
        }
    }

    handleGlobalClick(e) {
        if (e.target.closest('#game-back-btn')) {
            PrefsManager.vibrate(10);
            window.history.back();
            return;
        }

        if (e.target.id === 'game-start-btn' || e.target.id === 'game-restart-btn') {
            PrefsManager.vibrate(15);
            this.startGame();
        }
    }

    handleKeydown(e) {
        if (!this.isPlaying) return;
        this.onKeyPress(e.key);
    }

    startGame() {
        document.getElementById('game-start-overlay').classList.remove('active');
        document.getElementById('game-gameover-overlay').classList.remove('active');
        
        this.score = 0;
        this.updateScoreUI();
        this.isPlaying = true;
        
        this.onGameStart();
        
        if (this.options.useGameLoop) {
            this.lastTime = performance.now();
            if (this.animationId) cancelAnimationFrame(this.animationId);
            this.animationId = requestAnimationFrame(this.coreLoop);
        }
    }

    stopGame() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameOver(title = "Игра окончена!") {
        this.stopGame();
        PrefsManager.vibrate([30, 50, 50]);
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(`sh_${this.id}_best`, this.bestScore);
            document.getElementById('game-best-score').textContent = this.bestScore;
        }

        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-final-score-text').textContent = `Твой счет: ${this.score}`;
        document.getElementById('game-gameover-overlay').classList.add('active');
    }

    addScore(points) {
        this.score += points;
        this.updateScoreUI();
    }

    updateScoreUI() {
        document.getElementById('game-current-score').textContent = this.score;
    }

    coreLoop(timestamp) {
        if (!this.isPlaying || !this.isMounted) return;
        
        const deltaTime = timestamp - this.lastTime;
        
        this.onGameUpdate(deltaTime, timestamp);
        this.onGameDraw();
        
        if (this.isPlaying) {
            this.animationId = requestAnimationFrame(this.coreLoop);
        }
    }

    initTouchControls() {
        if (!this.area) return;
        let startX = 0, startY = 0;
        let isTap = true;
        
        this.area.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isTap = true;
        }, { passive: false });

        this.area.addEventListener('touchmove', e => {
            if (Math.abs(e.touches[0].clientX - startX) > 10 || Math.abs(e.touches[0].clientY - startY) > 10) {
                isTap = false;
            }
        }, { passive: false });

        this.area.addEventListener('touchend', e => {
            if (!this.isPlaying) return;
            
            if (isTap) {
                this.onTap();
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - startX;
            const dy = endY - startY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.onSwipe(dx > 0 ? 'right' : 'left');
            } else {
                this.onSwipe(dy > 0 ? 'down' : 'up');
            }
        });

        this.area.addEventListener('mousedown', () => {
            if (this.isPlaying) this.onTap();
        });
    }
}