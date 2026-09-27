/* =====================================================================
   FILE: js/components/Modal.js
   Системные уведомления с перехватом кнопки "Назад"
===================================================================== */
import { getIcon } from '../utils/icons.js';
import { PrefsManager } from '../utils/prefs.js';

export const Modal = {
    isOpen: false,
    onCloseCallback: null,

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
            this.close(true);
        });

        window.addEventListener('popstate', (e) => {
            if (this.isOpen) {
                if (!e.state || e.state.modal !== 'alert') {
                    this.close(false); 
                }
            }
        });
    },

    showAlert(title, message, type = 'info', onClose = null) {
        this.init();
        const dialog = document.getElementById('system-alert-dialog');
        
        if (dialog.open) dialog.close();

        const iconContainer = document.getElementById('system-alert-icon');
        
        let iconName = 'success';
        if (type === 'admin') iconName = 'admin';
        else if (type === 'warning') iconName = 'warning';
        
        iconContainer.innerHTML = getIcon(iconName, { size: 48, strokeWidth: 2 });
        document.getElementById('system-alert-title').textContent = title;
        document.getElementById('system-alert-text').textContent = message;
        
        this.onCloseCallback = onClose;
        this.isOpen = true;
        history.pushState({ modal: 'alert' }, '', window.location.hash);
        dialog.showModal();
    },

    close(isProgrammatic = true) {
        const dialog = document.getElementById('system-alert-dialog');
        if (!dialog || !dialog.open) return;

        this.isOpen = false;
        dialog.close();

        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }

        if (isProgrammatic) {
            history.back();
        }
    }
};