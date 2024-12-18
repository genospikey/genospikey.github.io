import * as PIXI from 'pixi.js';
import Vizualiser from './Vizualiser';

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export default class VizualiserAI extends Vizualiser {
    constructor(app, audioAnalyser) {
        super(app, audioAnalyser);
        this.cubes = [];
        this.speedFactor = 1;
        this.rotationSpeedFactor = 1;
        this.decayRate = 0.05;

        for (let i = 0; i < this.audioAnalyser.dataArray.length; i++) {
            const size = Math.random() * 20 + 10; // random size between 10 and 30
            const cube = new PIXI.Graphics();
            cube.beginFill(this.getColor(size));
            cube.drawRect(0, 0, size, size);
            cube.endFill();
            cube.pivot.set(size / 2, size / 2);
            cube.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
            this.stage.addChild(cube);
            this.cubes.push({ cube, speed: Math.random() * 0.5 + 0.5, rotationSpeed: Math.random() * 0.01 + 0.005 });

            this.audioAnalyser.on('beat' + i, () => this.onBeat(i));
        }
    }

    getColor(size) {
        const baseColor = 0x00FF00;
        const variation = Math.floor((size / 30) * 0xFFFFFF); // vary the color based on size
        return baseColor + variation;
    }

    onBeat(index) {
        this.cubes[index].speed *= 1.5;
        this.cubes[index].rotationSpeed *= 1.5;
    }

    update(delta) {
        for (let i = 0; i < this.cubes.length; i++) {
            const { cube, speed, rotationSpeed } = this.cubes[i];
            // Clamp speed and rotation speed 
            
            this.cubes[i].speed = clamp(this.cubes[i].speed, 0.5, 3); 
            this.cubes[i].rotationSpeed = clamp(this.cubes[i].rotationSpeed, 0.005, 0.05);
                        
            cube.rotation += rotationSpeed * delta;
            cube.position.x += speed * delta;

            // Decay speed and rotation speed over time, clamp
            this.cubes[i].speed = Math.max(0.5, this.cubes[i].speed - this.decayRate * delta);
            this.cubes[i].rotationSpeed = Math.max(0.005, this.cubes[i].rotationSpeed - this.decayRate * delta);

            // Reset position if it moves out of bounds
            if (cube.position.x > this.app.screen.width) {
                cube.position.x = 0;
            }
        }
    }

    resize() {
        // Handle resize events if needed
    }

    destroy() {
        for (let { cube } of this.cubes) {
            this.app.stage.removeChild(cube);
            cube.destroy();
        }
    }    
}
