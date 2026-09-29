import { getIcon } from '../utils/icons.js';

export const Lightbox = {
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
            if (e.target.id === 'global-lightbox-body') window.history.back();
        });

        dialog.querySelector('#global-lightbox-close').addEventListener('click', () => window.history.back());
    },

    open(imageSrc, fileName = 'photo.jpg') {
        const url = new URL(window.location);
        url.hash = url.hash.split('?')[0] + `?lightbox=${encodeURIComponent(imageSrc)}`;
        window.location.hash = url.hash; // Роутер подхватит и вызовет render()
    },

    render(imageSrc) {
        this.init();
        const dialog = document.getElementById('global-lightbox');
        const img = document.getElementById('global-lightbox-img');
        const dlBtn = document.getElementById('global-lightbox-download');

        img.src = imageSrc;
        dlBtn.href = imageSrc;
        if (!dialog.open) dialog.showModal();
    },

    hide() {
        const dialog = document.getElementById('global-lightbox');
        if (dialog && dialog.open) dialog.close();
    }
};