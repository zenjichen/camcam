/**
 * Water Droplet Cursor Effect
 * True liquid simulation using particle system with gravity
 */

const initCursorEffect = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';

    document.body.appendChild(canvas);

    let width, height;
    const particles = [];

    const onResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', onResize);
    onResize();

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            // Random spread for splashing effect
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.gravity = 0.2; // Gravity pulls drops down
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.02; // Random fade speed
            this.size = Math.random() * 3 + 2; // Varying drop sizes
            this.color = `rgba(0, 255, 255, 0.5)`; // Base Cyan tint
            this.initialX = x; // To track drift if needed
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity; // Apply gravity
            this.life -= this.decay;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            // Gradient fill for "liquid" look
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * this.life);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.life})`); // White core
            gradient.addColorStop(1, `rgba(0, 200, 255, ${this.life * 0.2})`); // Blue halo

            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    let lastX = 0;
    let lastY = 0;

    window.addEventListener('mousemove', (e) => {
        // Only spawn if moved enough to avoid clustering
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);

        if (dist > 5) {
            // Spawn multiple particles for a splashy trail
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(e.clientX, e.clientY));
            }
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    const render = () => {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update();
            p.draw(ctx);

            if (p.life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(render);
    };

    render();
};

if (window.matchMedia("(min-width: 768px)").matches) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursorEffect);
    } else {
        initCursorEffect();
    }
}
