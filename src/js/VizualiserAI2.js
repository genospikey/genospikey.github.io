import * as PIXI from 'pixi.js';
import Vizualiser from './Vizualiser';

// Clamping function
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export default class VizualiserAI2 extends Vizualiser {
    initElements() {
        this.balls = [];
        this.gravity = 0.1; // Gravity strength
        this.decayRate = 0.05;

        for (let i = 0; i < 20; i++) { // Reduced to 20 balls
            const size = Math.random() * 20 + 10; // random size between 10 and 30
            const ball = new PIXI.Graphics();
            ball.beginFill(this.getColor(size));
            ball.drawCircle(0, 0, size / 2);
            ball.endFill();
            ball.pivot.set(size / 2, size / 2);
            ball.position.set(Math.random() * this.app.screen.width, Math.random() * this.app.screen.height);
            this.stage.addChild(ball); // Add to stage
            this.balls.push({ ball, size, speedX: Math.random() * 2 - 1, speedY: Math.random() * 2 - 1, rotationSpeed: Math.random() * 0.01 + 0.005 });

            if (i < this.audioAnalyser.dataArray.length) {
                this.audioAnalyser.on('beat' + i, () => this.onBeat(i));
            }
        }
    }

    getColor(size) {
        const baseColor = 0x00FF00; // Use a safe base color
        const variation = Math.floor((size / 30) * 0x00FF00); // Ensure variation stays within a safe range
        return baseColor + variation;
    }

    onBeat(index) {
        this.balls[index].speedX *= 1.5;
        this.balls[index].speedY *= 1.5;
        this.balls[index].rotationSpeed *= 1.5;
    }

    update(delta) {
        for (let i = 0; i < this.balls.length; i++) {
            const { ball, speedX, speedY, rotationSpeed } = this.balls[i];
            ball.rotation += rotationSpeed * delta;
            ball.position.x += speedX * delta;
            ball.position.y += speedY * delta + this.gravity * delta; // Add gravity effect

            // Bounce off the edges
            if (ball.position.x <= 0 || ball.position.x >= this.app.screen.width) {
                this.balls[i].speedX *= -1;
            }
            if (ball.position.y >= this.app.screen.height) { // Bounce off the bottom
                this.balls[i].speedY *= -0.8; // Reverse and reduce speed to simulate energy loss
                ball.position.y = this.app.screen.height;
            }

            // Clamp speed and rotation speed
            this.balls[i].speedX = clamp(this.balls[i].speedX, -3, 3);
            this.balls[i].speedY = clamp(this.balls[i].speedY, -3, 3);
            this.balls[i].rotationSpeed = clamp(this.balls[i].rotationSpeed, 0.005, 0.05);

            // Decay speed and rotation speed over time
            if (Math.abs(this.balls[i].speedX) > 0.5) {
                this.balls[i].speedX *= 0.95;
            } else {
                this.balls[i].speedX = 0.5 * Math.sign(this.balls[i].speedX);
            }
            if (Math.abs(this.balls[i].speedY) > 0.5) {
                this.balls[i].speedY *= 0.95;
            } else {
                this.balls[i].speedY = 0.5 * Math.sign(this.balls[i].speedY);
            }
            this.balls[i].rotationSpeed = Math.max(0.005, this.balls[i].rotationSpeed - this.decayRate * delta);
        }

        this.handleCollisions();
    }

    handleCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ballA = this.balls[i];
                const ballB = this.balls[j];

                const dx = ballA.ball.position.x - ballB.ball.position.x;
                const dy = ballA.ball.position.y - ballB.ball.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = (ballA.size / 2) + (ballB.size / 2);

                if (distance < minDist) {
                    // Simple collision response: exchange speeds
                    const angle = Math.atan2(dy, dx);
                    const targetX = ballB.ball.position.x + Math.cos(angle) * minDist;
                    const targetY = ballB.ball.position.y + Math.sin(angle) * minDist;

                    const ax = (targetX - ballA.ball.position.x) * 0.5;
                    const ay = (targetY - ballA.ball.position.y) * 0.5;

                    ballA.speedX -= ax;
                    ballA.speedY -= ay;
                    ballB.speedX += ax;
                    ballB.speedY += ay;

                    // Clamp speeds after collision
                    ballA.speedX = clamp(ballA.speedX, -3, 3);
                    ballA.speedY = clamp(ballA.speedY, -3, 3);
                    ballB.speedX = clamp(ballB.speedX, -3, 3);
                    ballB.speedY = clamp(ballB.speedY, -3, 3);
                }
            }
        }
    }

    resize() {
        // Handle resize events if needed
    }

    destroy() {
        for (let { ball } of this.balls) {
            this.stage.removeChild(ball); // Remove from stage
            ball.destroy();
        }
    }
}
