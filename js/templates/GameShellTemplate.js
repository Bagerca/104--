/* =====================================================================
   FILE: js/templates/GameShellTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const GameShellTemplate = {
    renderUI({ title, bestScore, hint, innerHTML, isSquare = false, noPadding = false }) {
        return `
            <div class="game-container slide-left">
                <div class="game-header">
                    <button class="icon-btn" id="game-back-btn" aria-label="Назад к играм" style="background: var(--overlay-bg-active); border-radius: 50%;">
                        ${getIcon('back', { size: 20 })}
                    </button>
                    <div class="game-scores">
                        <div class="score-box">
                            <span class="score-label">Счет</span>
                            <span class="score-value" id="game-current-score">0</span>
                        </div>
                        <div class="score-box">
                            <span class="score-label">Рекорд</span>
                            <span class="score-value best" id="game-best-score">${bestScore}</span>
                        </div>
                    </div>
                </div>

                <div class="game-area ${isSquare ? 'square' : ''} ${noPadding ? 'no-padding' : ''}" id="game-area">
                    ${innerHTML}
                    
                    <div class="game-overlay active" id="game-start-overlay">
                        <h2>${title}</h2>
                        <p>${hint}</p>
                        <button class="game-btn" id="game-start-btn">Играть</button>
                    </div>

                    <div class="game-overlay" id="game-gameover-overlay">
                        <h2 id="game-over-title">Игра окончена!</h2>
                        <p id="game-final-score-text">Твой счет: 0</p>
                        <button class="game-btn" id="game-restart-btn">Еще раз</button>
                    </div>
                </div>

                <div class="game-controls-hint">${hint} на экране (или стрелочки/пробел на ПК)</div>
            </div>
        `;
    }
};