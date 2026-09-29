import { getIcon } from '../utils/icons.js';
import { PrefsManager } from '../utils/prefs.js';
import { Store } from '../store.js';

export const Modal = {
    init() {
        if (document.getElementById('system-alert-dialog')) return;
        const dialog = document.createElement('dialog');
        dialog.id = 'system-alert-dialog';
        dialog.className = 'custom-theme-modal';
        dialog.style.textAlign = 'center';
        
        dialog.innerHTML = `
            <div id="system-alert-icon" style="margin-bottom: 12px; color: var(--theme-accent); display: flex; justify-content: center;"></div>
            <h3 id="system-alert-title" style="margin-bottom: 8px;"></h3>
            <p id="system-alert-text" style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px;"></p>
            <div class="modal-actions">
                <button class="modal-btn save" id="btn-close-alert">Понятно</button>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('btn-close-alert').addEventListener('click', () => {
            PrefsManager.vibrate(10);
            window.history.back();
        });
    },

    showAlert(title, message, type = 'info') {
        Store.setState({ modalState: { title, message, type } });
        const url = new URL(window.location);
        url.hash = url.hash.split('?')[0] + `?alert=true`;
        window.location.hash = url.hash;
    },

    render() {
        const data = Store.getState().modalState;
        if (!data) { window.history.back(); return; } // Защита от прямого захода по ссылке без данных

        this.init();
        const dialog = document.getElementById('system-alert-dialog');
        const iconContainer = document.getElementById('system-alert-icon');
        
        let iconName = data.type === 'admin' ? 'admin' : (data.type === 'warning' ? 'warning' : 'success');
        
        iconContainer.innerHTML = getIcon(iconName, { size: 48, strokeWidth: 2 });
        document.getElementById('system-alert-title').textContent = data.title;
        document.getElementById('system-alert-text').textContent = data.message;
        
        if (!dialog.open) dialog.showModal();
    },

    hide() {
        const dialog = document.getElementById('system-alert-dialog');
        if (dialog && dialog.open) {
            dialog.close();
            Store.setState({ modalState: null });
        }
    }
};