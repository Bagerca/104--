/* =====================================================================
   FILE: js/components/Modal.js
   Глобальный компонент всплывающих окон (Alerts & Confirms)
===================================================================== */
import { PrefsManager } from '../utils/prefs.js';

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
            dialog.close();
            if (this.onCloseCallback) {
                this.onCloseCallback();
                this.onCloseCallback = null;
            }
        });
    },

    showAlert(title, message, type = 'info', onClose = null) {
        this.init();
        const dialog = document.getElementById('system-alert-dialog');
        const iconContainer = document.getElementById('system-alert-icon');
        
        let svg = '';
        if (type === 'admin') {
            svg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>`;
        } else if (type === 'warning') {
            svg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else {
            svg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }
        
        iconContainer.innerHTML = svg;
        document.getElementById('system-alert-title').textContent = title;
        document.getElementById('system-alert-text').textContent = message;
        
        this.onCloseCallback = onClose;
        dialog.showModal();
    }
};