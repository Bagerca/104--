/* =====================================================================
   FILE: js/views/2048View.js
===================================================================== */
import { BaseGameView } from './BaseGameView.js';
import { PrefsManager } from '../utils/prefs.js';

export class Game2048View extends BaseGameView {
    constructor(container) {
        super('2048', '2048', 'Свайпай цифры', container, { isSquare: true, noPadding: false, useGameLoop: false });
        this.board = [];
    }

    getInnerHtml() {
        return `<div class="g2048-grid" id="g2048-grid"></div>`;
    }

    onGameInit() {
        this.gridEl = document.getElementById('g2048-grid');
    }

    onGameStart() {
        this.board = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
        this.spawnTile();
        this.spawnTile();
        this.onGameDraw();
    }

    spawnTile() {
        let empty = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === 0) empty.push({r, c});
            }
        }
        if (empty.length > 0) {
            let rand = empty[Math.floor(Math.random() * empty.length)];
            this.board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    onGameDraw() {
        // ЗАЩИТА: Если доска ещё не создана, не пытаемся её рисовать!
        if (!this.board || this.board.length === 0) return;

        let html = '';
        for(let r = 0; r < 4; r++) {
            for(let c = 0; c < 4; c++) {
                const val = this.board[r][c];
                html += val === 0 ? `<div class="g2048-cell"></div>` : 
                    `<div class="g2048-cell"><div class="g2048-tile ${val >= 4096 ? 'tile-super' : `tile-${val}`}">${val}</div></div>`;
            }
        }
        this.gridEl.innerHTML = html;
    }

    operate(row) {
        let arr = row.filter(val => val);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                this.addScore(arr[i]);
                arr[i + 1] = 0;
            }
        }
        arr = arr.filter(val => val);
        while (arr.length < 4) arr.push(0);
        return arr;
    }

    move(direction) {
        let oldBoard = JSON.stringify(this.board);

        if (direction === 'left' || direction === 'right') { 
            for (let r = 0; r < 4; r++) {
                let row = this.board[r];
                if (direction === 'right') row.reverse();
                row = this.operate(row);
                if (direction === 'right') row.reverse();
                this.board[r] = row;
            }
        } else { 
            for (let c = 0; c < 4; c++) {
                let col = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]];
                if (direction === 'down') col.reverse();
                col = this.operate(col);
                if (direction === 'down') col.reverse();
                for (let r = 0; r < 4; r++) this.board[r][c] = col[r];
            }
        }

        if (oldBoard !== JSON.stringify(this.board)) {
            PrefsManager.vibrate(10);
            this.spawnTile();
            this.onGameDraw();
            if (this.checkGameOver()) this.gameOver("Ходов нет");
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

    onSwipe(dir) { this.move(dir); }
    onKeyPress(key) {
        switch(key) {
            case 'ArrowUp': case 'w': case 'W': this.move('up'); break;
            case 'ArrowDown': case 's': case 'S': this.move('down'); break;
            case 'ArrowLeft': case 'a': case 'A': this.move('left'); break;
            case 'ArrowRight': case 'd': case 'D': this.move('right'); break;
        }
    }
}