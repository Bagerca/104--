/* =====================================================================
   FILE: js/templates/SnakeTemplate.js
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const SnakeTemplate = {
    renderUI(bestScore) {
        return `
            <div class="snake-container slide-left">
                <div class="snake-header">
                    <button class="settings-back-btn" id="game-back-btn" aria-label="Назад к играм">
                        ${getIcon('back', { size: 20 })}
                    </button>
                    <div class="snake-scores">
                        <div class="score-box">
                            <span class="score-label">Счет</span>
                            <span class="score-value" id="snake-current-score">0</span>
                        </div>
                        <div class="score-box" style="margin-left: 12px;">
                            <span class="score-label">Рекорд</span>
                            <span class="score-value" id="snake-best-score" style="color: var(--theme-accent-text);">${bestScore}</span>
                        </div>
                    </div>
                </div>

                <div class="snake-game-area" id="snake-game-area">
                    <canvas id="snake-canvas"></canvas>
                    
                    <div class="snake-overlay active" id="snake-start-overlay">
                        <h2>Змейка</h2>
                        <p>Свайпай для управления</p>
                        <button class="snake-btn" id="snake-start-btn">Играть</button>
                    </div>

                    <div class="snake-overlay" id="snake-gameover-overlay">
                        <h2>Игра окончена!</h2>
                        <p id="snake-final-score-text">Твой счет: 0</p>
                        <button class="snake-btn" id="snake-restart-btn">Еще раз</button>
                    </div>
                </div>

                <div class="snake-controls-hint">Свайпай пальцем по игровому полю (или стрелочками на ПК)</div>
            </div>
        `;
    }
};