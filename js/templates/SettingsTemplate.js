/* =====================================================================
   FILE: js/templates/SettingsTemplate.js
   Шаблоны для раздела Настроек
===================================================================== */
export const SettingsTemplate = {
    renderMain(data) {
        return `
            <div class="settings-container">
                <div class="settings-header">
                    <button class="settings-back-btn" id="settings-back-btn" aria-label="Назад">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div class="settings-title">
                        <h2>Настройки</h2>
                        <span>Параметры приложения</span>
                    </div>
                </div>
                
                <section class="settings-section">
                    <h3 class="settings-section-title">Оформление</h3>
                    <div class="theme-card" style="margin-bottom: 12px;">
                        <div class="theme-scroll-wrapper" id="theme-scroll-wrapper">
                            ${data.themes.map(theme => `
                                <div class="theme-swatch-container ${data.currentTheme === theme.id ? 'active' : ''}" data-id="${theme.id}">
                                    <button class="theme-swatch" style="--swatch-accent: ${theme.color}; --swatch-bg: ${theme.bg};"></button>
                                    <span class="theme-name-label">${theme.name}</span>
                                </div>
                            `).join('')}
                            
                            <div class="theme-swatch-container ${data.currentTheme === 'custom' ? 'active' : ''}" data-id="custom">
                                <button class="theme-swatch custom-btn" id="btn-open-custom" style="--swatch-accent: ${data.customData.accent}; --swatch-bg: ${data.customData.bg};">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                <span class="theme-name-label">Своя</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-list" style="overflow: visible;">
                        <div class="settings-list-item">
                            <div class="item-label-group">
                                <span>Свои обои</span>
                                <span class="item-subtitle">Фон под стеклом</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${data.hasWallpaper ? `<button id="btn-clear-wp" class="inline-select" style="background: rgba(255,0,0,0.2); color: #ff4d4d; border: none; cursor: pointer;">Удалить</button>` : ''}
                                <label for="upload-wp" class="inline-select" style="cursor: pointer; display: flex; align-items: center;">
                                    ${data.hasWallpaper ? 'Изменить' : 'Выбрать'}
                                </label>
                                <input type="file" id="upload-wp" accept="image/*" style="display: none;">
                            </div>
                        </div>
                    </div>
                </section>

                <section class="settings-section">
                    <h3 class="settings-section-title">Основное</h3>
                    <div class="settings-list" style="overflow: visible;">
                        <div class="settings-list-item">
                            <div class="item-label-group">
                                <span>Нижняя панель</span>
                                <span class="item-subtitle">Порядок кнопок и стартовый экран</span>
                            </div>
                            <button id="btn-open-nav-order" class="inline-select" style="cursor: pointer; border:none; outline:none;">Настроить</button>
                        </div>

                        <div class="settings-list-item">
                            <div class="item-label-group">
                                <span>Моя подгруппа</span>
                                <span class="item-subtitle">Иностранный язык и др.</span>
                            </div>
                            <div class="custom-select-wrapper" id="subgroup-wrapper">
                                <button class="custom-select-btn" id="subgroup-btn">
                                    <span id="subgroup-text">${data.subgroupText}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div class="custom-select-menu">
                                    <div class="custom-select-option ${data.prefs.subgroup === 'all' ? 'selected' : ''}" data-value="all">Обе (Показывать всё)</div>
                                    <div class="custom-select-option ${data.prefs.subgroup === '1' ? 'selected' : ''}" data-value="1">1 подгруппа</div>
                                    <div class="custom-select-option ${data.prefs.subgroup === '2' ? 'selected' : ''}" data-value="2">2 подгруппа</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="settings-section">
                    <h3 class="settings-section-title">Устройства</h3>
                    <div class="settings-list">
                        <div class="settings-list-item" id="toggle-notif-wrapper">
                            <div class="item-label-group">
                                <span style="${data.notifDenied ? 'color: #ff4d4d' : ''}">Напоминание о 1-й паре</span>
                                <span class="item-subtitle">За 30 мин <strong style="color:var(--theme-accent);">(Экспериментально)</strong></span>
                            </div>
                            <div class="toggle-switch ${data.prefs.notifications ? 'active' : ''}" id="toggle-notif"></div>
                        </div>
                        
                        <div class="settings-list-item" id="toggle-haptic-wrapper">
                            <div class="item-label-group">
                                <span>Виброотклик</span>
                                <span class="item-subtitle">Тактильная отдача при нажатиях</span>
                            </div>
                            <div class="toggle-switch ${data.prefs.haptic ? 'active' : ''}" id="toggle-haptic"></div>
                        </div>

                        <div class="settings-list-item" id="toggle-power-wrapper">
                            <div class="item-label-group">
                                <span style="color: #4CAF50;">Энергосбережение</span>
                                <span class="item-subtitle">Выкл. эффекты, блюр и обои</span>
                            </div>
                            <div class="toggle-switch ${data.prefs.powerSave ? 'active' : ''}" id="toggle-power"></div>
                        </div>
                        
                        ${data.isSeasonalActive ? `
                            <div class="settings-list-item" id="toggle-particles-wrapper">
                                <div class="item-label-group">
                                    <span>Анимация частиц</span>
                                    <span class="item-subtitle">Снег / Искры</span>
                                </div>
                                <div class="toggle-switch ${data.prefs.particles ? 'active' : ''}" id="toggle-particles"></div>
                            </div>
                        ` : ''}
                    </div>
                </section>

                <section class="settings-section">
                    <h3 class="settings-section-title">Система и данные</h3>
                    <div class="settings-list">
                        <button class="settings-list-item" id="btn-reset-hw">
                            <span>Сбросить прогресс домашки</span>
                        </button>
                        <button class="settings-list-item danger-text" id="btn-clear-cache">
                            <span>Очистить кэш и обновить</span>
                        </button>
                    </div>
                </section>

                <footer class="settings-footer">
                    <div class="version-text" id="app-version">v2.0.0 (Clean Architecture)</div>
                    <div class="credits">Сделал <a href="https://t.me/bagerca" target="_blank">BAGERca</a> &copy; 2026 - ${data.currentYear}</div>
                </footer>
            </div>

            <!-- МОДАЛКИ (Только те, что уникальны для Настроек) -->
            <dialog id="custom-theme-dialog" class="custom-theme-modal">
                <h3>Создать тему</h3>
                <div class="color-picker-group">
                    <label for="picker-bg">Цвет фона</label>
                    <input type="color" id="picker-bg" value="${data.customData.bg}">
                </div>
                <div class="color-picker-group">
                    <label for="picker-accent">Цвет акцента</label>
                    <input type="color" id="picker-accent" value="${data.customData.accent}">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn cancel" id="btn-cancel-custom">Отмена</button>
                    <button class="modal-btn save" id="btn-save-custom">Применить</button>
                </div>
            </dialog>

            <dialog id="nav-order-dialog" class="custom-theme-modal">
                <h3>Порядок панелей</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-bottom: 16px;">Первая кнопка открывается при запуске</p>
                <div id="nav-order-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="modal-btn save" id="btn-save-nav">Сохранить</button>
                </div>
            </dialog>
        `;
    },

    renderNavList(navOrder, navNames) {
        return navOrder.map((id, index) => `
            <div class="nav-reorder-item">
                <span>${index + 1}. ${navNames[id]}</span>
                <div class="nav-reorder-controls">
                    <button class="nav-move-btn" data-dir="-1" data-idx="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="nav-move-btn" data-dir="1" data-idx="${index}" ${index === navOrder.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
            </div>
        `).join('');
    }
};