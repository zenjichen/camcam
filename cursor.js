/**
 * Water Droplet / Fluid Cursor Effect
 * Replicates the fluid trail effect seen on zenjichen.github.io
 */

const initCursorEffect = () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Click-through
    canvas.style.zIndex = '9999';

    document.body.appendChild(canvas);

    let width, height;
    let lastX = -100;
    let lastY = -100;
    const particles = [];

    // Resize handler
    const onResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', onResize);
    onResize();

    // Mouse handler
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.age = 0;
            this.force = Math.random() * 0.5 + 0.5; // Variation in size/speed
        }
    }

    window.addEventListener('mousemove', (e) => {
        // Add points based on distance moved
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);

        if (dist > 2) {
            particles.push(new Point(e.clientX, e.clientY));
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    // Animation Loop
    const render = () => {
        ctx.clearRect(0, 0, width, height);

        // Fluid Style Settings
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // We'll draw a connecting line that gets thinner instantly
        if (particles.length > 1) {
            ctx.beginPath();

            // Draw the trail using quadratric curves for smoothness
            // We can treat it like a 'snake' or simple fading stroke

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.age++;

                // Remove old particles
                if (p.age > 25) { // Life duration
                    particles.splice(i, 1);
                    i--;
                    continue;
                }
            }

            // Draw segments
            for (let i = 0; i < particles.length - 1; i++) {
                const p1 = particles[i];
                const p2 = particles[i + 1];

                const life = 1 - (p1.age / 25);
                if (life <= 0) continue;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                // Droplet style: White/Cyan core with blur?
                // User asked for "Water Droplet"
                // Usually this is a white/bluish stroke that fades

                const size = 10 * life; // Start thick, get thin? Or vice versa? 
                // Trail usually gets thinner at the end (older points)

                ctx.lineWidth = size;

                // Color: 
                // A nice water blue-ish/white
                // gradient stroke?

                ctx.strokeStyle = `rgba(0, 255, 255, ${life * 0.5})`; // Cyan glow
                ctx.stroke();

                // Inner white core
                ctx.lineWidth = size * 0.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${life * 0.8})`;
                ctx.stroke();
            }
        }

        requestAnimationFrame(render);
    };

    render();
};

// Initialize only on desktop to save mobile performance
if (window.matchMedia("(min-width: 768px)").matches) {
    document.addEventListener('DOMContentLoaded', initCursorEffect);
    // Also run if DOMContentLoaded already happened
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initCursorEffect();
    }
}
