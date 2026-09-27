/* =====================================================================
   FILE: js/components/Toast.js
   Глобальный компонент всплывающих уведомлений (Toast)
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const Toast = {
    timeout: null,

    show(message, type = 'info', duration = 3000) {
        let toast = document.getElementById('system-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'system-toast';
            document.body.appendChild(toast);
        }

        const iconName = type === 'offline' ? 'offline' : 'success';

        // Формируем чистую разметку с использованием getIcon
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${getIcon(iconName, { size: 22 })}
                </div>
                <span class="toast-text">${message}</span>
            </div>
            <button class="toast-close-btn" aria-label="Закрыть">
                ${getIcon('close', { size: 20 })}
            </button>
        `;
        
        toast.className = `toast-notification toast-${type} show`;

        // Событие на крестик
        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            this.hide();
        });

        if (this.timeout) clearTimeout(this.timeout);
        
        // Если duration = 0, уведомление висит бесконечно, пока не закроют
        if (duration > 0) {
            this.timeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    },

    hide() {
        const toast = document.getElementById('system-toast');
        if (toast) {
            toast.classList.remove('show');
        }
    }
};