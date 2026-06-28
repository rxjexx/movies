/* ========================
   4K GRID BACKGROUND - MOUSE REACTIVE
   ======================== */

class GridBackground {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        
        this.init();
    }

    init() {
        this.setCanvasSize();
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.targetMouseX = window.innerWidth / 2;
        this.targetMouseY = window.innerHeight / 2;
        this.setupEventListeners();
        this.animate();
    }

    setCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('resize', () => this.setCanvasSize());
        document.addEventListener('mouseleave', () => this.onMouseLeave());
    }

    onMouseMove(e) {
        this.targetMouseX = e.clientX;
        this.targetMouseY = e.clientY;
    }

    onMouseLeave() {
        this.targetMouseX = window.innerWidth / 2;
        this.targetMouseY = window.innerHeight / 2;
    }

    drawGrid() {
        const gridSize = 50;
        const distortionRadius = 300;
        const maxDistortion = 30;

        // Smooth mouse position
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

        // Draw horizontal lines
        for (let y = 0; y < window.innerHeight; y += gridSize) {
            this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();

            for (let x = 0; x < window.innerWidth; x += 10) {
                // Calculate distance from mouse
                const dx = x - this.mouseX;
                const dy = y - this.mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Apply distortion based on mouse proximity
                let distortion = 0;
                if (distance < distortionRadius) {
                    const influence = 1 - distance / distortionRadius;
                    distortion = Math.sin(distance * 0.02) * maxDistortion * influence;
                    
                    // Brighten grid near mouse
                    const brightness = 0.5 + influence * 0.8;
                    this.ctx.strokeStyle = `rgba(212, 175, 55, ${brightness})`;
                }

                if (x === 0) {
                    this.ctx.moveTo(x, y + distortion);
                } else {
                    this.ctx.lineTo(x, y + distortion);
                }
            }
            this.ctx.stroke();
        }

        // Draw vertical lines
        for (let x = 0; x < window.innerWidth; x += gridSize) {
            this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();

            for (let y = 0; y < window.innerHeight; y += 10) {
                // Calculate distance from mouse
                const dx = x - this.mouseX;
                const dy = y - this.mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Apply distortion based on mouse proximity
                let distortion = 0;
                if (distance < distortionRadius) {
                    const influence = 1 - distance / distortionRadius;
                    distortion = Math.sin(distance * 0.02) * maxDistortion * influence;
                    
                    // Brighten grid near mouse
                    const brightness = 0.5 + influence * 0.8;
                    this.ctx.strokeStyle = `rgba(212, 175, 55, ${brightness})`;
                }

                if (y === 0) {
                    this.ctx.moveTo(x + distortion, y);
                } else {
                    this.ctx.lineTo(x + distortion, y);
                }
            }
            this.ctx.stroke();
        }
    }

    drawMouseIndicator() {
        // Removed - no mouse indicator
    }

    animate() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(5, 5, 5, 1)';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw grid
        this.drawGrid();
        this.drawMouseIndicator();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GridBackground();
});
