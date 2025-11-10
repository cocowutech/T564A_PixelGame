// Pixel Runner Animation
// Handles the 8-bit runner character animation

class RunnerAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.runner = {
            x: 50,
            y: 50,
            width: 32,
            height: 32,
            frame: 0,
            isRunning: false,
            isDashing: false,
            isStumbling: false
        };
        this.animationFrame = null;
        this.frameCount = 0;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    // Draw the pixel runner using basic shapes
    drawRunner() {
        const { x, y, width, height, frame } = this.runner;
        const ctx = this.ctx;

        ctx.save();

        // Color scheme
        const primaryColor = '#00ff9f';
        const secondaryColor = '#ffbe0b';
        const skinColor = '#ffd6a5';

        // Body position offset for running animation
        const bobOffset = this.runner.isRunning ? Math.sin(frame * 0.5) * 2 : 0;

        // Head
        ctx.fillStyle = skinColor;
        ctx.fillRect(x + 12, y + bobOffset, 8, 8);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 13, y + 2 + bobOffset, 2, 2);
        ctx.fillRect(x + 17, y + 2 + bobOffset, 2, 2);

        // Body
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x + 10, y + 8 + bobOffset, 12, 12);

        // Arms (animated when running)
        ctx.fillStyle = skinColor;
        if (this.runner.isRunning) {
            const armSwing = Math.sin(frame * 0.5) * 4;
            // Left arm
            ctx.fillRect(x + 6, y + 10 + bobOffset + armSwing, 4, 8);
            // Right arm
            ctx.fillRect(x + 22, y + 10 + bobOffset - armSwing, 4, 8);
        } else {
            // Arms at rest
            ctx.fillRect(x + 6, y + 10 + bobOffset, 4, 8);
            ctx.fillRect(x + 22, y + 10 + bobOffset, 4, 8);
        }

        // Legs (animated when running)
        ctx.fillStyle = secondaryColor;
        if (this.runner.isRunning) {
            const legStride = Math.sin(frame * 0.5) * 3;
            // Left leg
            ctx.fillRect(x + 10, y + 20 + bobOffset, 4, 8);
            ctx.fillRect(x + 10 + legStride, y + 28, 4, 4);
            // Right leg
            ctx.fillRect(x + 18, y + 20 + bobOffset, 4, 8);
            ctx.fillRect(x + 18 - legStride, y + 28, 4, 4);
        } else {
            // Legs at rest
            ctx.fillRect(x + 10, y + 20 + bobOffset, 4, 12);
            ctx.fillRect(x + 18, y + 20 + bobOffset, 4, 12);
        }

        // Dash effect
        if (this.runner.isDashing) {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 2;
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = 0.3 / i;
                ctx.strokeRect(x - (i * 10), y + bobOffset, width, height);
            }
            ctx.globalAlpha = 1;
        }

        // Stumble effect (shake and red tint)
        if (this.runner.isStumbling) {
            ctx.fillStyle = 'rgba(255, 0, 110, 0.3)';
            ctx.fillRect(x, y + bobOffset, width, height);
        }

        ctx.restore();
    }

    // Move runner to a specific position with animation
    moveTo(targetX, targetY, duration = 500) {
        return new Promise((resolve) => {
            const startX = this.runner.x;
            const startY = this.runner.y;
            const startTime = Date.now();

            this.runner.isRunning = true;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeProgress = progress < 0.5
                    ? 2 * progress * progress
                    : -1 + (4 - 2 * progress) * progress;

                this.runner.x = startX + (targetX - startX) * easeProgress;
                this.runner.y = startY + (targetY - startY) * easeProgress;
                this.runner.frame++;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.runner.isRunning = false;
                    resolve();
                }
            };

            animate();
        });
    }

    // Dash animation (correct answer)
    async dash(distance = 100) {
        this.runner.isDashing = true;
        await this.moveTo(this.runner.x + distance, this.runner.y, 300);
        this.runner.isDashing = false;
    }

    // Stumble animation (wrong answer)
    async stumble() {
        this.runner.isStumbling = true;
        const originalX = this.runner.x;

        // Shake effect
        for (let i = 0; i < 4; i++) {
            await this.moveTo(originalX - 5, this.runner.y, 50);
            await this.moveTo(originalX + 5, this.runner.y, 50);
        }

        await this.moveTo(originalX, this.runner.y, 50);
        this.runner.isStumbling = false;
    }

    // Jump animation (bonus or special event)
    async jump() {
        const originalY = this.runner.y;
        await this.moveTo(this.runner.x, originalY - 30, 200);
        await this.moveTo(this.runner.x, originalY, 200);
    }

    // Start the animation loop
    start() {
        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawRunner();
            this.frameCount++;
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    // Stop the animation loop
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Reset runner position
    reset() {
        this.runner.x = 50;
        this.runner.y = 50;
        this.runner.frame = 0;
        this.runner.isRunning = false;
        this.runner.isDashing = false;
        this.runner.isStumbling = false;
    }

    // Set runner position
    setPosition(x, y) {
        this.runner.x = x;
        this.runner.y = y;
    }

    // Get runner position
    getPosition() {
        return { x: this.runner.x, y: this.runner.y };
    }
}

export default RunnerAnimation;
