/* =====================================================================
   FILE: js/views/TicTacToeView.js
===================================================================== */
import { BaseGameView } from './BaseGameView.js';
import { PrefsManager } from '../utils/prefs.js';
import { getIcon } from '../utils/icons.js';

export class TicTacToeView extends BaseGameView {
    constructor(container) {
        super('tictactoe', 'Крестики-нолики', 'Собери 3 в ряд', container, { 
            isSquare: false, // Изменили на false, так как у нас есть переключатель
            noPadding: false, 
            useGameLoop: false 
        });
        
        this.board = Array(9).fill(null);
        this.gameMode = 'bot'; // 'bot' или 'pvp'
        this.currentPlayer = 'X'; // Текущий ход (для PvP)
        this.isBotThinking = false;
        
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleModeToggle = this.handleModeToggle.bind(this);
    }

    getInnerHtml() {
        return `
            <div class="ttt-container">
                <div class="ttt-mode-toggle" id="ttt-mode-toggle">
                    <button class="ttt-mode-btn active" data-mode="bot">
                        ${getIcon('user', { size: 18 })} 1 Игрок
                    </button>
                    <button class="ttt-mode-btn" data-mode="pvp">
                        ${getIcon('users', { size: 18 })} 2 Игрока
                    </button>
                </div>
                
                <div class="ttt-turn-indicator" id="ttt-turn-indicator" style="opacity: 0;">
                    Ход: <span id="ttt-turn-symbol" class="x-turn">X</span>
                </div>

                <div class="ttt-grid" id="ttt-grid"></div>
            </div>
        `;
    }

    onGameInit() {
        this.gridEl = document.getElementById('ttt-grid');
        this.modeToggleEl = document.getElementById('ttt-mode-toggle');
        this.turnIndicatorEl = document.getElementById('ttt-turn-indicator');
        this.turnSymbolEl = document.getElementById('ttt-turn-symbol');
        
        this.gridEl.addEventListener('click', this.handleCellClick);
        this.modeToggleEl.addEventListener('click', this.handleModeToggle);
    }

    unmount() {
        super.unmount();
        this.gridEl.removeEventListener('click', this.handleCellClick);
        this.modeToggleEl.removeEventListener('click', this.handleModeToggle);
    }

    handleModeToggle(e) {
        const btn = e.target.closest('.ttt-mode-btn');
        if (!btn) return;
        
        const newMode = btn.dataset.mode;
        if (this.gameMode === newMode) return;

        PrefsManager.vibrate(10);
        this.gameMode = newMode;
        
        this.modeToggleEl.querySelectorAll('.ttt-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Принудительный рестарт игры при смене режима
        if (this.isPlaying) this.startGame();
    }

    onGameStart() {
        this.board = Array(9).fill(null);
        this.isBotThinking = false;
        this.currentPlayer = 'X'; // Всегда начинают крестики
        
        this.updateTurnUI();
        this.onGameDraw();
    }

    updateTurnUI() {
        if (this.gameMode === 'bot') {
            this.turnIndicatorEl.style.opacity = '0'; // Прячем в игре с ботом
        } else {
            this.turnIndicatorEl.style.opacity = '1';
            this.turnSymbolEl.textContent = this.currentPlayer;
            this.turnSymbolEl.className = this.currentPlayer === 'X' ? 'x-turn' : 'o-turn';
        }
    }

    handleCellClick(e) {
        if (!this.isPlaying || this.isBotThinking) return;
        
        const cellEl = e.target.closest('.ttt-cell');
        if (!cellEl) return;

        const index = parseInt(cellEl.dataset.index);
        if (this.board[index] !== null) return;

        PrefsManager.vibrate(5);

        if (this.gameMode === 'pvp') {
            // ЛОГИКА ИГРЫ С ДРУГОМ (PvP)
            this.board[index] = this.currentPlayer;
            this.onGameDraw();

            if (this.checkGameState(this.currentPlayer)) return;

            // Смена хода
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateTurnUI();

        } else {
            // ЛОГИКА ИГРЫ С БОТОМ
            this.board[index] = 'X'; // Игрок всегда X
            this.onGameDraw();

            if (this.checkGameState('X')) return;

            this.isBotThinking = true;
            setTimeout(() => this.makeBotMove(), 400);
        }
    }

    makeBotMove() {
        if (!this.isPlaying) return;

        let moveIndex = -1;
        const bot = 'O';
        const player = 'X';

        // 1. Попытка победить
        moveIndex = this.findBestMove(bot);
        
        // 2. Блокировка победы игрока
        if (moveIndex === -1) moveIndex = this.findBestMove(player);
        
        // 3. Захват центра
        if (moveIndex === -1 && this.board[4] === null) moveIndex = 4;

        // 4. Случайная свободная клетка
        if (moveIndex === -1) {
            const emptyCells = this.board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
            if (emptyCells.length > 0) {
                moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        if (moveIndex !== -1) {
            this.board[moveIndex] = bot;
            PrefsManager.vibrate(10);
            this.onGameDraw();
            this.checkGameState(bot);
        }
        
        this.isBotThinking = false;
    }

    findBestMove(targetSymbol) {
        for (let pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            const cells = [this.board[a], this.board[b], this.board[c]];
            const targetCount = cells.filter(val => val === targetSymbol).length;
            const emptyCount = cells.filter(val => val === null).length;

            if (targetCount === 2 && emptyCount === 1) {
                if (this.board[a] === null) return a;
                if (this.board[b] === null) return b;
                if (this.board[c] === null) return c;
            }
        }
        return -1;
    }

    checkGameState(lastPlayer) {
        // Проверка победы
        for (let pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWin(pattern);
                
                let winMessage = "";
                if (this.gameMode === 'bot') {
                    winMessage = lastPlayer === 'X' ? "Победа! 🎉" : "Бот победил! 🤖";
                    if (lastPlayer === 'X') this.addScore(100);
                } else {
                    winMessage = lastPlayer === 'X' ? "Крестики победили! ❌" : "Нолики победили! ⭕";
                    this.addScore(100); // Очки просто за завершение матча
                }

                setTimeout(() => this.gameOver(winMessage), 500);
                return true;
            }
        }

        // Проверка ничьей
        if (!this.board.includes(null)) {
            if (this.gameMode === 'bot') this.addScore(10); 
            setTimeout(() => this.gameOver("Ничья! 🤝"), 500);
            return true;
        }

        return false;
    }

    highlightWin(pattern) {
        pattern.forEach(index => {
            const cell = this.gridEl.querySelector(`[data-index="${index}"]`);
            if (cell) cell.classList.add('win');
        });
    }

    onGameDraw() {
        if (!this.board || this.board.length === 0) return;

        let html = '';
        for (let i = 0; i < 9; i++) {
            const val = this.board[i];
            const cls = val === 'X' ? 'x' : (val === 'O' ? 'o' : '');
            html += `<div class="ttt-cell ${cls}" data-index="${i}">${val || ''}</div>`;
        }
        
        if (this.gridEl.innerHTML !== html) {
            this.gridEl.innerHTML = html;
        }
    }
}