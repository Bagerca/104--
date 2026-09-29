/* =====================================================================
   FILE: js/views/SnakeView.js
===================================================================== */
import { SnakeTemplate } from '../templates/SnakeTemplate.js';
import { PrefsManager } from '../utils/prefs.js';

export class SnakeView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        
        this.gridSize = 20; 
        this.tileCount = 20;
        this.speed = 130; 
        
        this.snake = [];
        this.velocity = { x: 0, y: 0 };
        this.nextVelocity = { x: 0, y: 0 }; 
        this.food = { x: 15, y: 15 };
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('sh_snake_best')) || 0;
        
        this.isPlaying = false;
        this.lastTime = 0;
        this.animationId = null;

        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.preventScroll = (e) => e.preventDefault();
    }

    async mount() {
        this.isMounted = true;
        this.container.innerHTML = SnakeTemplate.renderUI(this.bestScore);
        
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.area = document.getElementById('snake-game-area');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.container.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeydown);
        
        // Жесткая блокировка любого скролла и свайпов на всем экране
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
        if (e.target.id === 'snake-start-btn' || e.target.id === 'snake-restart-btn') {
            PrefsManager.vibrate(15);
            this.startGame();
        }
    }

    startGame() {
        document.getElementById('snake-start-overlay').classList.remove('active');
        document.getElementById('snake-gameover-overlay').classList.remove('active');
        
        this.snake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        this.velocity = { x: 0, y: -1 };
        this.nextVelocity = { x: 0, y: -1 };
        this.score = 0;
        this.updateScoreUI();
        this.placeFood();
        
        this.isPlaying = true;
        this.lastTime = performance.now();
        
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
            localStorage.setItem('sh_snake_best', this.bestScore);
            document.getElementById('snake-best-score').textContent = this.bestScore;
        }

        document.getElementById('snake-final-score-text').textContent = `Твой счет: ${this.score}`;
        document.getElementById('snake-gameover-overlay').classList.add('active');
    }

    gameLoop(timestamp) {
        if (!this.isPlaying || !this.isMounted) return;
        
        this.animationId = requestAnimationFrame(this.gameLoop);
        
        if (timestamp - this.lastTime < this.speed) return; 
        this.lastTime = timestamp;
        
        this.updatePhysics();
        this.draw();
    }

    updatePhysics() {
        this.velocity = { ...this.nextVelocity }; 
        
        let head = { 
            x: this.snake[0].x + this.velocity.x, 
            y: this.snake[0].y + this.velocity.y 
        };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head); 

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreUI();
            this.placeFood();
            PrefsManager.vibrate(10); 
            if (this.speed > 60) this.speed -= 2; 
        } else {
            this.snake.pop(); 
        }
    }

    placeFood() {
        let newX, newY, isOnSnake;
        do {
            isOnSnake = false;
            newX = Math.floor(Math.random() * this.tileCount);
            newY = Math.floor(Math.random() * this.tileCount);
            for (let part of this.snake) {
                if (part.x === newX && part.y === newY) isOnSnake = true;
            }
        } while (isOnSnake);
        this.food = { x: newX, y: newY };
    }

    updateScoreUI() {
        document.getElementById('snake-current-score').textContent = this.score;
    }

    draw() {
        if (!this.ctx) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const tileW = w / this.tileCount;
        const tileH = h / this.tileCount;

        this.ctx.clearRect(0, 0, w, h);

        const rootStyles = getComputedStyle(document.documentElement);
        const accentColor = rootStyles.getPropertyValue('--theme-accent').trim() || '#4CAF50';
        const foodColor = '#FF4D4D'; 

        this.ctx.fillStyle = foodColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * tileW + tileW / 2, 
            this.food.y * tileH + tileH / 2, 
            (tileW / 2) - 2, 
            0, Math.PI * 2
        );
        this.ctx.fill();

        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillStyle = i === 0 ? accentColor : rootStyles.getPropertyValue('--theme-accent-soft').trim() || 'rgba(255,255,255,0.5)';
            if (i !== 0 && (!this.ctx.fillStyle || this.ctx.fillStyle === '')) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
            }
            this.ctx.fillRect(
                this.snake[i].x * tileW + 1, 
                this.snake[i].y * tileH + 1, 
                tileW - 2, 
                tileH - 2
            );
        }
    }

    handleKeydown(e) {
        if (!this.isPlaying) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W':
                if (this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 }; break;
            case 'ArrowDown': case 's': case 'S':
                if (this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 }; break;
            case 'ArrowLeft': case 'a': case 'A':
                if (this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 }; break;
            case 'ArrowRight': case 'd': case 'D':
                if (this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 }; break;
        }
    }

    initTouchControls() {
        if (!this.area) return;
        let startX = 0, startY = 0;
        
        this.area.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: false });

        this.area.addEventListener('touchend', e => {
            if (!this.isPlaying) return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const dx = endX - startX;
            const dy = endY - startY;
            
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 }; 
                else if (dx < 0 && this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 };
            } else {
                if (dy > 0 && this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 }; 
                else if (dy < 0 && this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 };
            }
        });
    }
}