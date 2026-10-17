/* =====================================================================
   FILE: js/utils/ui.js
===================================================================== */
export const UIUtils = {
    getAvatarGradient(text) {
        if (!text) return 'linear-gradient(135deg, #555, #222)';
        const charCode = text.charCodeAt(0) + (text.charCodeAt(1) || 0) + (text.charCodeAt(2) || 0);
        const hue = charCode % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 40}, 70%, 40%))`;
    },

    shootConfetti() {
        if (document.body.classList.contains('power-save-mode')) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#FF4D7D', '#93002E', '#007AFF', '#FFAB00', '#4CAF50', '#ffffff'];

        // Создаем 80 частичек, которые вылетают из нижних углов экрана
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() < 0.5 ? 0 : canvas.width, 
                y: canvas.height,
                vx: (Math.random() * 15 + 5) * (Math.random() < 0.5 ? 1 : -1),
                vy: -(Math.random() * 18 + 10), 
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10
            });
            
            // Направляем частицы внутрь экрана
            if (particles[i].x === 0) particles[i].vx = Math.abs(particles[i].vx);
            else particles[i].vx = -Math.abs(particles[i].vx);
        }

        let animationId;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            
            particles.forEach(p => {
                p.vy += 0.4; // Гравитация
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotSpeed;
                
                // Если хоть одна частица на экране — продолжаем анимацию
                if (p.y < canvas.height + 20) active = true;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            });

            if (active) {
                animationId = requestAnimationFrame(draw);
            } else {
                canvas.remove(); // Убираем canvas после завершения
            }
        };
        draw();
    }
};