/* =====================================================================
   FILE: js/views/MinesweeperView.js
===================================================================== */
import { BaseGameView } from './BaseGameView.js';
import { PrefsManager } from '../utils/prefs.js';
import { getIcon } from '../utils/icons.js';

export class MinesweeperView extends BaseGameView {
    constructor(container) {
        super('minesweeper', 'Сапёр', 'Раскопай поле, не задень мины', container, { 
            isSquare: false, 
            noPadding: false, 
            useGameLoop: false 
        });
        
        this.rows = 9;
        this.cols = 9;
        this.minesCount = 10;
        
        this.board = [];
        this.isFirstClick = true;
        this.mode = 'dig'; // 'dig' или 'flag'
        this.revealedCount = 0;
        
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleModeToggle = this.handleModeToggle.bind(this);
    }

    getInnerHtml() {
        return `
            <div class="ms-container">
                <div class="ms-grid" id="ms-grid"></div>
                
                <div class="ms-mode-toggle" id="ms-mode-toggle">
                    <button class="ms-mode-btn active" data-mode="dig">
                        ${getIcon('shovel', { size: 18 })} Копать
                    </button>
                    <button class="ms-mode-btn" data-mode="flag">
                        ${getIcon('flag', { size: 18 })} Флажок
                    </button>
                </div>
            </div>
        `;
    }

    onGameInit() {
        this.gridEl = document.getElementById('ms-grid');
        this.modeToggleEl = document.getElementById('ms-mode-toggle');
        
        this.gridEl.addEventListener('click', this.handleCellClick);
        this.modeToggleEl.addEventListener('click', this.handleModeToggle);
    }

    unmount() {
        super.unmount();
        this.gridEl.removeEventListener('click', this.handleCellClick);
        this.modeToggleEl.removeEventListener('click', this.handleModeToggle);
    }

    onGameStart() {
        this.isFirstClick = true;
        this.revealedCount = 0;
        this.board = [];
        this.mode = 'dig';
        
        this.modeToggleEl.querySelectorAll('.ms-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === 'dig');
        });

        for (let r = 0; r < this.rows; r++) {
            let row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    r: r, c: c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                });
            }
            this.board.push(row);
        }
        
        this.onGameDraw();
    }

    handleModeToggle(e) {
        const btn = e.target.closest('.ms-mode-btn');
        if (!btn || !this.isPlaying) return;
        
        PrefsManager.vibrate(10);
        this.mode = btn.dataset.mode;
        
        this.modeToggleEl.querySelectorAll('.ms-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    handleCellClick(e) {
        if (!this.isPlaying) return;
        const cellEl = e.target.closest('.ms-cell');
        if (!cellEl) return;

        const r = parseInt(cellEl.dataset.r);
        const c = parseInt(cellEl.dataset.c);
        const cell = this.board[r][c];

        if (cell.isRevealed) return;

        if (this.mode === 'flag') {
            PrefsManager.vibrate(5);
            cell.isFlagged = !cell.isFlagged;
            this.onGameDraw();
            return;
        }

        if (cell.isFlagged) return; 

        if (this.isFirstClick) {
            this.generateMines(r, c);
            this.isFirstClick = false;
        }

        if (cell.isMine) {
            this.revealAllMines();
            this.onGameDraw();
            this.gameOver("Ты подорвался!");
            return;
        }

        this.floodFillReveal(r, c);
        this.onGameDraw();
        this.checkWin();
    }

    generateMines(safeR, safeC) {
        let minesPlaced = 0;
        while (minesPlaced < this.minesCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            if (!this.board[r][c].isMine && (r !== safeR || c !== safeC)) {
                this.board[r][c].isMine = true;
                minesPlaced++;
            }
        }
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    this.board[r][c].neighborMines = this.countNeighbors(r, c);
                }
            }
        }
    }

    countNeighbors(r, c) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    if (this.board[nr][nc].isMine) count++;
                }
            }
        }
        return count;
    }

    floodFillReveal(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        const cell = this.board[r][c];
        
        if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

        cell.isRevealed = true;
        this.revealedCount++;
        this.addScore(10);
        PrefsManager.vibrate(3); 

        if (cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    this.floodFillReveal(r + dr, c + dc);
                }
            }
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) {
                    this.board[r][c].isRevealed = true;
                }
            }
        }
    }

    checkWin() {
        const totalSafeCells = (this.rows * this.cols) - this.minesCount;
        if (this.revealedCount === totalSafeCells) {
            this.addScore(500);
            this.revealAllMines();
            this.onGameDraw();
            this.gameOver("Победа! Все мины найдены!");
        }
    }

    onGameDraw() {
        // ЗАЩИТА ОТ ПЕРЕРИСОВКИ ПУСТОЙ ДОСКИ (Решает твою ошибку)
        if (!this.board || this.board.length === 0) return;

        let html = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                let content = '';
                let extraClass = '';
                
                if (cell.isRevealed) {
                    extraClass = 'revealed';
                    if (cell.isMine) {
                        content = getIcon('bomb', { size: 20, color: '#ff4d4d' });
                        extraClass += ' mine';
                    } else if (cell.neighborMines > 0) {
                        content = `<span class="ms-num-${cell.neighborMines}">${cell.neighborMines}</span>`;
                    }
                } else if (cell.isFlagged) {
                    content = getIcon('flag', { size: 20, color: '#FF9800' });
                }

                html += `<div class="ms-cell ${extraClass}" data-r="${r}" data-c="${c}">${content}</div>`;
            }
        }
        this.gridEl.innerHTML = html;
    }
}