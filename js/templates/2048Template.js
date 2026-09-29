/* =====================================================================
   FILE: js/templates/2048Template.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const Game2048Template = {
    renderUI(bestScore) {
        return `
            <div class="g2048-container slide-left">
                <div class="g2048-header">
                    <button class="settings-back-btn" id="game-back-btn" aria-label="Назад к играм">
                        ${getIcon('back', { size: 20 })}
                    </button>
                    <div class="g2048-scores">
                        <div class="score-box">
                            <span class="score-label">Счет</span>
                            <span class="score-value" id="g2048-current-score">0</span>
                        </div>
                        <div class="score-box" style="margin-left: 12px;">
                            <span class="score-label">Рекорд</span>
                            <span class="score-value" id="g2048-best-score" style="color: var(--theme-accent-text);">${bestScore}</span>
                        </div>
                    </div>
                </div>

                <div class="g2048-game-area" id="g2048-game-area">
                    <div class="g2048-grid" id="g2048-grid">
                        <!-- Сетка рендерится через JS -->
                    </div>
                    
                    <div class="g2048-overlay active" id="g2048-start-overlay">
                        <h2>2048</h2>
                        <p>Свайпай, чтобы объединять цифры!</p>
                        <button class="g2048-btn" id="g2048-start-btn">Начать</button>
                    </div>

                    <div class="g2048-overlay" id="g2048-gameover-overlay">
                        <h2>Игра окончена</h2>
                        <p id="g2048-final-score-text">Твой счет: 0</p>
                        <button class="g2048-btn" id="g2048-restart-btn">Еще раз</button>
                    </div>
                </div>

                <div class="g2048-controls-hint">Свайпай пальцем или используй стрелочки на ПК</div>
            </div>
        `;
    },

    renderGrid(board) {
        let html = '';
        for(let r = 0; r < 4; r++) {
            for(let c = 0; c < 4; c++) {
                const val = board[r][c];
                if(val === 0) {
                    html += `<div class="g2048-cell"></div>`;
                } else {
                    const tileClass = val >= 4096 ? 'tile-super' : `tile-${val}`;
                    html += `
                        <div class="g2048-cell">
                            <div class="g2048-tile ${tileClass}">${val}</div>
                        </div>`;
                }
            }
        }
        return html;
    }
};