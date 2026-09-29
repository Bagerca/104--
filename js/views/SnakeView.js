/* =====================================================================
   FILE: js/views/SnakeView.js
===================================================================== */
import { BaseGameView } from './BaseGameView.js';
import { PrefsManager } from '../utils/prefs.js';

export class SnakeView extends BaseGameView {
    constructor(container) {
        super('snake', 'Змейка', 'Свайпай для управления', container, { isSquare: true, noPadding: true });
        
        this.gridSize = 20;
        this.speed = 130;
        this.snake = [];
        this.velocity = { x: 0, y: 0 };
        this.nextVelocity = { x: 0, y: 0 };
        this.food = { x: 0, y: 0 };
        this.accumulatedTime = 0;
    }

    getInnerHtml() {
        return `<canvas id="game-canvas" class="game-canvas"></canvas>`;
    }

    onGameInit() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    onGameStart() {
        this.snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        this.velocity = { x: 0, y: -1 };
        this.nextVelocity = { x: 0, y: -1 };
        this.speed = 130;
        this.accumulatedTime = 0;
        this.placeFood();
        this.resizeCanvas();
    }

    resizeCanvas() {
        const rect = this.area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    onGameUpdate(deltaTime, timestamp) {
        this.accumulatedTime += deltaTime;
        if (this.accumulatedTime < this.speed) return;
        
        this.accumulatedTime = 0;
        this.lastTime = timestamp;

        this.velocity = { ...this.nextVelocity };
        let head = { x: this.snake[0].x + this.velocity.x, y: this.snake[0].y + this.velocity.y };

        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            return this.gameOver();
        }

        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) return this.gameOver();
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.addScore(10);
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
            newX = Math.floor(Math.random() * this.gridSize);
            newY = Math.floor(Math.random() * this.gridSize);
            for (let part of this.snake) {
                if (part.x === newX && part.y === newY) isOnSnake = true;
            }
        } while (isOnSnake);
        this.food = { x: newX, y: newY };
    }

    onGameDraw() {
        if (!this.ctx) return;
        const w = this.canvas.width, h = this.canvas.height;
        const tileW = w / this.gridSize, tileH = h / this.gridSize;

        this.ctx.clearRect(0, 0, w, h);

        this.ctx.fillStyle = '#FF4D4D';
        this.ctx.beginPath();
        this.ctx.arc(this.food.x * tileW + tileW / 2, this.food.y * tileH + tileH / 2, (tileW / 2) - 2, 0, Math.PI * 2);
        this.ctx.fill();

        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillStyle = i === 0 ? this.colors.accent : (this.colors.accentSoft || 'rgba(255,255,255,0.4)');
            this.ctx.fillRect(this.snake[i].x * tileW + 1, this.snake[i].y * tileH + 1, tileW - 2, tileH - 2);
        }
    }

    onSwipe(dir) {
        if (dir === 'right' && this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 };
        if (dir === 'left' && this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 };
        if (dir === 'down' && this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 };
        if (dir === 'up' && this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 };
    }

    onKeyPress(key) {
        switch(key) {
            case 'ArrowUp': case 'w': case 'W': this.onSwipe('up'); break;
            case 'ArrowDown': case 's': case 'S': this.onSwipe('down'); break;
            case 'ArrowLeft': case 'a': case 'A': this.onSwipe('left'); break;
            case 'ArrowRight': case 'd': case 'D': this.onSwipe('right'); break;
        }
    }
}