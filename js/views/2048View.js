/* =====================================================================
   FILE: js/views/2048View.js
===================================================================== */
import { Game2048Template } from '../templates/2048Template.js';
import { PrefsManager } from '../utils/prefs.js';

export class Game2048View {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('sh_2048_best')) || 0;
        this.isPlaying = false;

        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.preventScroll = (e) => e.preventDefault();
    }

    async mount() {
        this.isMounted = true;
        document.getElementById('page-title').textContent = '2048';
        
        this.container.innerHTML = Game2048Template.renderUI(this.bestScore);
        
        this.gridEl = document.getElementById('g2048-grid');
        this.area = document.getElementById('g2048-game-area');
        
        this.container.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeydown);
        
        // Жесткая блокировка скролла
        this.container.addEventListener('touchmove', this.preventScroll, { passive: false });
        this.initTouchControls();
    }

    unmount() {
        this.isMounted = false;
        this.container.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleKeydown);
        this.container.removeEventListener('touchmove', this.preventScroll);
    }

    handleGlobalClick(e) {
        if (e.target.closest('#game-back-btn')) {
            PrefsManager.vibrate(10);
            window.history.back();
            return;
        }
        if (e.target.id === 'g2048-start-btn' || e.target.id === 'g2048-restart-btn') {
            PrefsManager.vibrate(15);
            this.startGame();
        }
    }

    startGame() {
        document.getElementById('g2048-start-overlay').classList.remove('active');
        document.getElementById('g2048-gameover-overlay').classList.remove('active');
        
        this.board = [
            [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]
        ];
        this.score = 0;
        this.isPlaying = true;
        
        this.spawnTile();
        this.spawnTile();
        this.updateUI();
    }

    spawnTile() {
        let emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) emptyCells.push({r, c});
            }
        }
        if (emptyCells.length > 0) {
            let rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateUI() {
        if (!this.isMounted) return;
        this.gridEl.innerHTML = Game2048Template.renderGrid(this.board);
        document.getElementById('g2048-current-score').textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('sh_2048_best', this.bestScore);
            document.getElementById('g2048-best-score').textContent = this.bestScore;
        }
    }

    gameOver() {
        this.isPlaying = false;
        PrefsManager.vibrate([30, 50, 50]);
        document.getElementById('g2048-final-score-text').textContent = `Твой счет: ${this.score}`;
        document.getElementById('g2048-gameover-overlay').classList.add('active');
    }

    operate(row) {
        let arr = row.filter(val => val);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                this.score += arr[i];
                arr[i + 1] = 0;
            }
        }
        arr = arr.filter(val => val);
        while (arr.length < 4) arr.push(0);
        return arr;
    }

    move(direction) {
        if (!this.isPlaying) return;
        let oldBoard = JSON.stringify(this.board);

        if (direction === 3 || direction === 1) { 
            for (let r = 0; r < 4; r++) {
                let row = this.board[r];
                if (direction === 1) row.reverse();
                row = this.operate(row);
                if (direction === 1) row.reverse();
                this.board[r] = row;
            }
        } else { 
            for (let c = 0; c < 4; c++) {
                let col = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]];
                if (direction === 2) col.reverse();
                col = this.operate(col);
                if (direction === 2) col.reverse();
                for (let r = 0; r < 4; r++) this.board[r][c] = col[r];
            }
        }

        if (oldBoard !== JSON.stringify(this.board)) {
            PrefsManager.vibrate(10);
            this.spawnTile();
            this.updateUI();
            if (this.checkGameOver()) this.gameOver();
        }
    }

    checkGameOver() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) return false;
                if (c < 3 && this.board[r][c] === this.board[r][c + 1]) return false;
                if (r < 3 && this.board[r][c] === this.board[r + 1][c]) return false;
            }
        }
        return true;
    }

    handleKeydown(e) {
        if (!this.isPlaying) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': this.move(0); break;
            case 'ArrowRight': case 'd': case 'D': this.move(1); break;
            case 'ArrowDown': case 's': case 'S': this.move(2); break;
            case 'ArrowLeft': case 'a': case 'A': this.move(3); break;
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
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.move(dx > 0 ? 1 : 3);
            } else {
                this.move(dy > 0 ? 2 : 0);
            }
        });
    }
}