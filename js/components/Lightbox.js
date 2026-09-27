/* =====================================================================
   FILE: js/components/Lightbox.js
   Просмотр фотографий на весь экран с поддержкой кнопки "Назад"
===================================================================== */
import { getIcon } from '../utils/icons.js';

export const Lightbox = {
    isOpen: false,

    init() {
        if (document.getElementById('global-lightbox')) return;

        const dialog = document.createElement('dialog');
        dialog.id = 'global-lightbox';
        dialog.className = 'hw-lightbox'; 
        
        dialog.innerHTML = `
            <div class="hw-lightbox-controls">
                <a id="global-lightbox-download" href="" download class="hw-lightbox-btn" aria-label="Скачать">
                    ${getIcon('download', { size: 20 })}
                </a>
                <button class="hw-lightbox-btn" id="global-lightbox-close" aria-label="Закрыть">
                    ${getIcon('close', { size: 24 })}
                </button>
            </div>
            <div class="hw-lightbox-body" id="global-lightbox-body">
                <img id="global-lightbox-img" src="" alt="Просмотр">
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#global-lightbox-body').addEventListener('click', (e) => {
            if (e.target.id === 'global-lightbox-body') this.close(true);
        });

        dialog.querySelector('#global-lightbox-close').addEventListener('click', () => {
            this.close(true);
        });

        window.addEventListener('popstate', (e) => {
            if (this.isOpen) {
                // Если стейт не наш - значит нажали кнопку назад. Закрываем.
                if (!e.state || e.state.modal !== 'lightbox') {
                    this.close(false); 
                }
            }
        });
    },

    open(imageSrc, fileName = 'photo.jpg') {
        this.init();
        const dialog = document.getElementById('global-lightbox');
        
        if (dialog.open) return;

        const img = document.getElementById('global-lightbox-img');
        const downloadBtn = document.getElementById('global-lightbox-download');

        img.src = imageSrc;
        downloadBtn.href = imageSrc;
        downloadBtn.setAttribute('download', fileName);
        
        this.isOpen = true;
        // Пушим стейт, сохраняя текущий URL (Hash), чтобы не триггерить роутер
        history.pushState({ modal: 'lightbox' }, '', window.location.hash);
        
        dialog.showModal();
    },

    close(isProgrammatic = true) {
        const dialog = document.getElementById('global-lightbox');
        if (!dialog || !dialog.open) return;

        this.isOpen = false;
        dialog.close();

        if (isProgrammatic) {
            history.back();
        }
    }
};