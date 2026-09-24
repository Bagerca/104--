/* =====================================================================
   FILE: js/components/Lightbox.js
===================================================================== */
export const Lightbox = {
    init() {
        if (document.getElementById('global-lightbox')) return;

        const dialog = document.createElement('dialog');
        dialog.id = 'global-lightbox';
        dialog.className = 'hw-lightbox'; 
        
        dialog.innerHTML = `
            <div class="hw-lightbox-controls">
                <a id="global-lightbox-download" href="" download class="hw-lightbox-btn" aria-label="Скачать">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
                <form method="dialog" style="margin: 0; padding: 0;">
                    <button class="hw-lightbox-btn" type="submit" aria-label="Закрыть">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </form>
            </div>
            <div class="hw-lightbox-body" id="global-lightbox-body">
                <img id="global-lightbox-img" src="" alt="Просмотр">
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#global-lightbox-body').addEventListener('click', (e) => {
            if (e.target.id === 'global-lightbox-body') dialog.close();
        });
    },

    open(imageSrc, fileName = 'photo.jpg') {
        this.init();
        const dialog = document.getElementById('global-lightbox');
        
        // ЗАЩИТА: Предотвращаем краш от двойного тапа
        if (dialog.open) return;

        const img = document.getElementById('global-lightbox-img');
        const downloadBtn = document.getElementById('global-lightbox-download');

        img.src = imageSrc;
        downloadBtn.href = imageSrc;
        downloadBtn.setAttribute('download', fileName);
        
        dialog.showModal();
    }
};