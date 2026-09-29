/* =====================================================================
   FILE: js/templates/GamesTemplate.js
===================================================================== */
export const GamesTemplate = {
    renderList(games) {
        return `
            <div class="games-list">
                ${games.map(game => this.renderCard(game)).join('')}
            </div>
        `;
    },

    renderCard(game) {
        return `
            <article class="game-card">
                <div class="game-cover">
                    <img src="${game.cover}" alt="${game.title}" class="game-cover-img" loading="lazy">
                </div>
                <div class="game-body">
                    <div class="game-title-row">
                        <h3 class="game-title">${game.title}</h3>
                        <span class="game-badge">${game.genre}</span>
                    </div>
                    <p class="game-desc">${game.description}</p>
                    
                    ${game.status === 'ready' 
                        ? `<a href="#/games/${game.id}" class="game-btn">Играть</a>` 
                        : `<button class="game-btn" style="background: var(--overlay-bg); color: var(--text-muted); cursor: not-allowed; box-shadow: none;">Скоро в Hub...</button>`}
                </div>
            </article>
        `;
    }
};