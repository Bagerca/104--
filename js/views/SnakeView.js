/* =====================================================================
   FILE: js/views/SnakeView.js
===================================================================== */
import { SnakeTemplate } from '../templates/SnakeTemplate.js';
import { PrefsManager } from '../utils/prefs.js';

export class SnakeView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        
        // Настройки игры
        this.gridSize = 20; // 20x20 клеток
        this.tileCount = 20;
        this.speed = 130; // миллисекунды на 1 кадр (чем меньше, тем быстрее)
        
        // Игровое состояние
        this.snake = [];
        this.velocity = { x: 0, y: 0 };
        this.nextVelocity = { x: 0, y: 0 }; // Для защиты от быстрого двойного свайпа
        this.food = { x: 15, y: 15 };
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('sh_snake_best')) || 0;
        
        this.isPlaying = false;
        this.lastTime = 0;
        this.animationId = null;

        // Привязка методов (важно для снятия слушателей)
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
    }

    async mount() {
        this.isMounted = true;
        document.getElementById('page-title').textContent = 'Змейка';
        
        this.container.innerHTML = SnakeTemplate.renderUI(this.bestScore);
        
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.area = document.getElementById('snake-game-area');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.container.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeydown);
        this.initTouchControls();
    }

    unmount() {
        this.isMounted = false;
        this.stopGame();
        this.container.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleKeydown);
        // Ресайз можно оставить, он не критичен, либо тоже отвязать, но мы не сохраняли ссылку на bind
    }

    resizeCanvas() {
        if (!this.canvas) return;
        // Делаем разрешение канваса физическим, чтобы не было мыла
        const rect = this.area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw(); // перерисовываем статику
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
        this.velocity = { x: 0, y: -1 }; // Движемся вверх
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
        PrefsManager.vibrate([30, 50, 50]); // Двойная вибрация при проигрыше
        
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
        
        if (timestamp - this.lastTime < this.speed) return; // Контроль скорости (FPS)
        this.lastTime = timestamp;
        
        this.updatePhysics();
        this.draw();
    }

    updatePhysics() {
        this.velocity = { ...this.nextVelocity }; // Применяем буферизированный ввод
        
        let head = { 
            x: this.snake[0].x + this.velocity.x, 
            y: this.snake[0].y + this.velocity.y 
        };

        // Столкновение со стенами (прохождение насквозь отключено, врезаемся = смерть)
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Столкновение с собой
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head); // Добавляем новую голову

        // Проверка еды
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreUI();
            this.placeFood();
            PrefsManager.vibrate(10); // Легкий тактильный отклик при съедании
            // Слегка ускоряем игру со временем
            if (this.speed > 60) this.speed -= 2; 
        } else {
            this.snake.pop(); // Удаляем хвост (движение)
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

        // Очистка
        this.ctx.clearRect(0, 0, w, h);

        // Получаем цвета из CSS переменных темы
        const rootStyles = getComputedStyle(document.documentElement);
        const accentColor = rootStyles.getPropertyValue('--theme-accent').trim() || '#4CAF50';
        const foodColor = '#FF4D4D'; // Красное яблоко

        // Рисуем еду
        this.ctx.fillStyle = foodColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * tileW + tileW / 2, 
            this.food.y * tileH + tileH / 2, 
            (tileW / 2) - 2, 
            0, Math.PI * 2
        );
        this.ctx.fill();

        // Рисуем змею
        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillStyle = i === 0 ? accentColor : rootStyles.getPropertyValue('--theme-accent-soft').trim() || 'rgba(255,255,255,0.5)';
            
            // Если это не голова и нет цвета (soft accent) - даем дефолтный белый прозрачный
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

    // --- УПРАВЛЕНИЕ ---

    handleKeydown(e) {
        if (!this.isPlaying) return;
        // Исключаем разворот на 180 градусов
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
        
        // touch-action: none в CSS блокирует скролл, но e.preventDefault() страхует
        this.area.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: false });

        this.area.addEventListener('touchmove', e => {
            e.preventDefault(); // Запрет скролла страницы при возне по канвасу
        }, { passive: false });

        this.area.addEventListener('touchend', e => {
            if (!this.isPlaying) return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const dx = endX - startX;
            const dy = endY - startY;
            
            // Защита от случайных микро-тапов
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Горизонтальный свайп
                if (dx > 0 && this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 }; // Право
                else if (dx < 0 && this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 }; // Лево
            } else {
                // Вертикальный свайп
                if (dy > 0 && this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 }; // Вниз
                else if (dy < 0 && this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 }; // Вверх
            }
        });
    }
}