/* =====================================================================
   FILE: js/templates/FlappyTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const FlappyTemplate = {
    renderUI(bestScore) {
        return `
            <div class="flappy-container slide-left">
                <div class="flappy-header">
                    <button class="settings-back-btn" id="game-back-btn" aria-label="Назад к играм">
                        ${getIcon('back', { size: 20 })}
                    </button>
                    <div class="flappy-scores">
                        <div class="score-box">
                            <span class="score-label">Счет</span>
                            <span class="score-value" id="flappy-current-score">0</span>
                        </div>
                        <div class="score-box" style="margin-left: 12px;">
                            <span class="score-label">Рекорд</span>
                            <span class="score-value" id="flappy-best-score" style="color: var(--theme-accent-text);">${bestScore}</span>
                        </div>
                    </div>
                </div>

                <div class="flappy-game-area" id="flappy-game-area">
                    <canvas id="flappy-canvas" class="flappy-canvas"></canvas>
                    
                    <div class="flappy-overlay active" id="flappy-start-overlay">
                        <h2>Flappy Bird</h2>
                        <p>Тапай, чтобы лететь!</p>
                        <button class="flappy-btn" id="flappy-start-btn">Полетели</button>
                    </div>

                    <div class="flappy-overlay" id="flappy-gameover-overlay">
                        <h2>Упс, врезался!</h2>
                        <p id="flappy-final-score-text">Твой счет: 0</p>
                        <button class="flappy-btn" id="flappy-restart-btn">Еще раз</button>
                    </div>
                </div>

                <div class="flappy-controls-hint">Тапай по экрану или жми Пробел на ПК</div>
            </div>
        `;
    }
};