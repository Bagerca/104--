/* =====================================================================
   FILE: js/utils/ui.js
   Глобальные визуальные утилиты
===================================================================== */
export const UIUtils = {
    getAvatarGradient(text) {
        if (!text) return 'linear-gradient(135deg, #555, #222)';
        const charCode = text.charCodeAt(0) + (text.charCodeAt(1) || 0) + (text.charCodeAt(2) || 0);
        const hue = charCode % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 40}, 70%, 40%))`;
    }
};