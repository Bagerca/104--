/* =====================================================================
   FILE: js/views/FlappyView.js
===================================================================== */
import { FlappyTemplate } from '../templates/FlappyTemplate.js';
import { PrefsManager } from '../utils/prefs.js';

export class FlappyView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        
        this.gravity = 0.25;
        this.jumpForce = -6;
        this.pipeSpeed = 3;
        this.pipeWidth = 60;
        this.pipeGap = 160;
        
        this.bird = { x: 50, y: 150, velocity: 0, radius: 12 };
        this.pipes = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('sh_flappy_best')) || 0;
        this.frameCount = 0;
        
        this.isPlaying = false;
        this.animationId = null;

        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.jump = this.jump.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.preventScroll = (e) => e.preventDefault();
    }

    async mount() {
        this.isMounted = true;
        document.getElementById('page-title').textContent = 'Flappy Bird';
        
        this.container.innerHTML = FlappyTemplate.renderUI(this.bestScore);
        
        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.area = document.getElementById('flappy-game-area');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.container.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeydown);
        
        // Жесткая блокировка скролла
        this.container.addEventListener('touchmove', this.preventScroll, { passive: false });
        this.initTouchControls();
    }

    unmount() {
        this.isMounted = false;
        this.stopGame();
        this.container.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleKeydown);
        this.container.removeEventListener('touchmove', this.preventScroll);
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw(); 
    }

    handleGlobalClick(e) {
        if (e.target.closest('#game-back-btn')) {
            PrefsManager.vibrate(10);
            window.history.back();
            return;
        }

        if (e.target.id === 'flappy-start-btn' || e.target.id === 'flappy-restart-btn') {
            PrefsManager.vibrate(15);
            this.startGame();
        }
    }

    startGame() {
        document.getElementById('flappy-start-overlay').classList.remove('active');
        document.getElementById('flappy-gameover-overlay').classList.remove('active');
        
        this.bird = { x: this.canvas.width * 0.3, y: this.canvas.height / 2, velocity: 0, radius: 12 };
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;
        this.updateScoreUI();
        
        this.isPlaying = true;
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    stopGame() {
        this.isPlaying = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    gameOver() {
        this.stopGame();
        PrefsManager.vibrate([30, 50, 50]); 
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('sh_flappy_best', this.bestScore);
            document.getElementById('flappy-best-score').textContent = this.bestScore;
        }

        document.getElementById('flappy-final-score-text').textContent = `Твой счет: ${this.score}`;
        document.getElementById('flappy-gameover-overlay').classList.add('active');
    }

    jump(e) {
        if (!this.isPlaying) return;
        if (e && e.cancelable) e.preventDefault();
        
        this.bird.velocity = this.jumpForce;
        PrefsManager.vibrate(5);
    }

    gameLoop() {
        if (!this.isPlaying || !this.isMounted) return;
        
        this.updatePhysics();
        this.draw();
        
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    updatePhysics() {
        this.frameCount++;
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.y + this.bird.radius >= this.canvas.height || this.bird.y - this.bird.radius <= 0) {
            this.gameOver();
            return;
        }

        if (this.frameCount % 90 === 0) {
            const minPipeHeight = 50;
            const maxPipeHeight = this.canvas.height - this.pipeGap - minPipeHeight;
            const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
            
            this.pipes.push({
                x: this.canvas.width,
                top: topHeight,
                bottom: topHeight + this.pipeGap,
                passed: false
            });
        }

        for (let i = 0; i < this.pipes.length; i++) {
            let p = this.pipes[i];
            p.x -= this.pipeSpeed;

            let hitX = this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth;
            let hitYTop = this.bird.y - this.bird.radius < p.top;
            let hitYBottom = this.bird.y + this.bird.radius > p.bottom;

            if (hitX && (hitYTop || hitYBottom)) {
                this.gameOver();
                return;
            }

            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.score++;
                p.passed = true;
                this.updateScoreUI();
                PrefsManager.vibrate(10);
            }
        }

        this.pipes = this.pipes.filter(p => p.x + this.pipeWidth > 0);
    }

    updateScoreUI() {
        document.getElementById('flappy-current-score').textContent = this.score;
    }

    draw() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        const rootStyles = getComputedStyle(document.documentElement);
        const accentColor = rootStyles.getPropertyValue('--theme-accent').trim() || '#FF0055';
        const pipeColor = 'rgba(255, 255, 255, 0.15)'; 
        const pipeBorder = 'rgba(255, 255, 255, 0.3)';

        this.pipes.forEach(p => {
            this.ctx.fillStyle = pipeColor;
            this.ctx.strokeStyle = pipeBorder;
            this.ctx.lineWidth = 2;

            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.strokeRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.fillRect(p.x, p.bottom, this.pipeWidth, h - p.bottom);
            this.ctx.strokeRect(p.x, p.bottom, this.pipeWidth, h - p.bottom);
        });

        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        
        let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.bird.velocity * 0.1)));
        this.ctx.rotate(rotation);

        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(4, -4, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    handleKeydown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            this.jump(e);
        }
    }

    initTouchControls() {
        if (!this.area) return;
        this.area.addEventListener('touchstart', this.jump, { passive: false });
        this.area.addEventListener('mousedown', this.jump, { passive: false });
    }
}