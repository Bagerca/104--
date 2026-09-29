/* =====================================================================
   FILE: js/views/FlappyView.js
===================================================================== */
import { BaseGameView } from './BaseGameView.js';
import { PrefsManager } from '../utils/prefs.js';

export class FlappyView extends BaseGameView {
    constructor(container) {
        super('flappy', 'Flappy Bird', 'Тапай по экрану', container, { isSquare: false, noPadding: true });
        
        this.gravity = 0.25;
        this.jumpForce = -6;
        this.pipeSpeed = 3;
        this.pipeWidth = 60;
        this.pipeGap = 160;
        
        this.bird = { x: 50, y: 150, velocity: 0, radius: 12 };
        this.pipes = [];
        this.frameCount = 0;
    }

    getInnerHtml() {
        return `<canvas id="game-canvas" class="game-canvas"></canvas>`;
    }

    onGameInit() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    onGameStart() {
        this.resizeCanvas();
        this.bird = { x: this.canvas.width * 0.3, y: this.canvas.height / 2, velocity: 0, radius: 12 };
        this.pipes = [];
        this.frameCount = 0;
    }

    resizeCanvas() {
        const rect = this.area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    onGameUpdate(deltaTime) {
        this.frameCount++;
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.y + this.bird.radius >= this.canvas.height || this.bird.y - this.bird.radius <= 0) {
            return this.gameOver("Упс, врезался!");
        }

        if (this.frameCount % 90 === 0) {
            const minH = 50;
            const maxH = this.canvas.height - this.pipeGap - minH;
            const topHeight = Math.floor(Math.random() * (maxH - minH + 1) + minH);
            this.pipes.push({ x: this.canvas.width, top: topHeight, bottom: topHeight + this.pipeGap, passed: false });
        }

        for (let i = 0; i < this.pipes.length; i++) {
            let p = this.pipes[i];
            p.x -= this.pipeSpeed;

            let hitX = this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth;
            let hitYTop = this.bird.y - this.bird.radius < p.top;
            let hitYBottom = this.bird.y + this.bird.radius > p.bottom;

            if (hitX && (hitYTop || hitYBottom)) return this.gameOver("Упс, врезался!");

            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.addScore(1);
                p.passed = true;
                PrefsManager.vibrate(10);
            }
        }
        this.pipes = this.pipes.filter(p => p.x + this.pipeWidth > 0);
    }

    onGameDraw() {
        if (!this.ctx) return;
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        const pipeColor = 'rgba(255, 255, 255, 0.15)', pipeBorder = 'rgba(255, 255, 255, 0.3)';

        this.pipes.forEach(p => {
            this.ctx.fillStyle = pipeColor; this.ctx.strokeStyle = pipeBorder; this.ctx.lineWidth = 2;
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.strokeRect(p.x, 0, this.pipeWidth, p.top);
            this.ctx.fillRect(p.x, p.bottom, this.pipeWidth, h - p.bottom);
            this.ctx.strokeRect(p.x, p.bottom, this.pipeWidth, h - p.bottom);
        });

        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.bird.velocity * 0.1))));
        this.ctx.fillStyle = this.colors.accent;
        this.ctx.beginPath(); this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath(); this.ctx.arc(4, -4, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.restore();
    }

    onTap() {
        this.bird.velocity = this.jumpForce;
        PrefsManager.vibrate(5);
    }

    onKeyPress(key) {
        if (key === ' ' || key === 'ArrowUp') this.onTap();
    }
}