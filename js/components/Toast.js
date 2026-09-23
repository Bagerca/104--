/* =====================================================================
   FILE: js/components/Toast.js
   Глобальный компонент всплывающих уведомлений (Toast)
===================================================================== */
export const Toast = {
    show(message, type = 'info', duration = 3000) {
        let toast = document.getElementById('system-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'system-toast';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'offline' 
                    ? '<path d="M1 1l22 22"></path><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>' 
                    : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                }
            </svg>
            <span>${message}</span>
        `;
        
        toast.className = `toast-notification toast-${type} show`;

        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
};