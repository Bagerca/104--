/* =====================================================================
   FILE: js/utils/icons.js
   АВТОГЕНЕРАЦИЯ: Файл собран скриптом build_icons.py
   Не редактируйте этот файл вручную! Меняйте .svg в папке src_icons/
===================================================================== */

const ICONS = {
    'admin': '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>',
    'back': '<polyline points="15 18 9 12 15 6"></polyline>',
    'check': '<polyline points="20 6 9 17 4 12"></polyline>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"></polyline>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"></polyline>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'close': '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
    'drag-handle': '<circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>',
    'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
    'flappy': '<circle cx="9" cy="12" r="4"/><path d="M11 12h4l2-2v4z"/><rect x="18" y="2" width="4" height="8"/><rect x="18" y="16" width="4" height="6"/>',
    'game-2048': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
    'location': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    'nav-events-halloween': '<path d="M12 2 L6 16 L2 16 L2 20 L22 20 L22 16 L18 16 Z"></path>',
    'nav-events-new-year': '<circle cx="12" cy="14" r="6"></circle> <rect x="10" y="6" width="4" height="2"></rect> <line x1="12" y1="2" x2="12" y2="6"></line>',
    'nav-events': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    'nav-games-halloween': '<rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect> <line x1="2" y1="6" x2="8" y2="10"></line><line x1="22" y1="6" x2="16" y2="10"></line> <line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line>',
    'nav-games-new-year': '<rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect> <line x1="12" y1="6" x2="12" y2="18"></line> <line x1="8" y1="2" x2="12" y2="6"></line> <line x1="16" y1="2" x2="12" y2="6"></line>',
    'nav-games': '<rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect> <line x1="6" y1="12" x2="10" y2="12"></line> <line x1="8" y1="10" x2="8" y2="14"></line> <line x1="15" y1="13" x2="15.01" y2="13"></line> <line x1="18" y1="11" x2="18.01" y2="11"></line>',
    'nav-group-halloween': '<path d="M9 22 V12 A5 5 0 0 1 19 12 V22 L17 20 L15 22 L13 20 L11 22 L9 20 Z"></path> <circle cx="12" cy="10" r="1"></circle><circle cx="16" cy="10" r="1"></circle>',
    'nav-group-new-year': '<circle cx="12" cy="8" r="3"></circle> <circle cx="12" cy="16" r="5"></circle> <path d="M9 8 H15"></path>',
    'nav-group': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> <circle cx="9" cy="7" r="4"></circle> <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path> <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'nav-homework-halloween': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <circle cx="10" cy="14" r="1"></circle><circle cx="14" cy="14" r="1"></circle> <path d="M10 17 L12 16 L14 17"></path>',
    'nav-homework-new-year': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <path d="M12 10 L9 14 H15 L12 10 Z"></path> <path d="M12 14 L8 18 H16 L12 14 Z"></path>',
    'nav-homework': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <polyline points="14 2 14 8 20 8"></polyline> <line x1="16" y1="13" x2="8" y2="13"></line> <line x1="16" y1="17" x2="8" y2="17"></line> <polyline points="10 9 9 9 8 9"></polyline>',
    'nav-schedule-halloween': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line> <line x1="12" y1="10" x2="12" y2="16"></line><circle cx="12" cy="17" r="1"></circle>',
    'nav-schedule-new-year': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line> <line x1="12" y1="13" x2="12" y2="19"></line> <line x1="9.5" y1="14.5" x2="14.5" y2="17.5"></line> <line x1="9.5" y1="17.5" x2="14.5" y2="14.5"></line>',
    'nav-schedule': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect> <line x1="16" y1="2" x2="16" y2="6"></line> <line x1="8" y1="2" x2="8" y2="6"></line> <line x1="3" y1="10" x2="21" y2="10"></line>',
    'offline': '<path d="M1 1l22 22"></path><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
    'refresh-spinner': '<path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
    'settings': '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
    'snake': '<path d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M2 14v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><circle cx="18" cy="10" r="1"/>',
    'success': '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
    'telegram': '<path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
    'warning': '<path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
};

export const getIcon = (name, options = {}) => {
    const iconContent = ICONS[name] || ICONS['nav-schedule'];
    const size = options.size || 24;
    const className = options.className ? `class="${options.className}"` : '';
    const color = options.color || 'currentColor';
    const strokeWidth = options.strokeWidth || 2;

    return `
        <svg ${className} width="${size}" height="${size}" viewBox="0 0 24 24" 
             fill="none" stroke="${color}" stroke-width="${strokeWidth}" 
             stroke-linecap="round" stroke-linejoin="round">
            ${iconContent}
        </svg>
    `.trim();
};
