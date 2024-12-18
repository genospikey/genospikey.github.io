import * as PIXI from 'pixi.js';
import * as PIXILayers from '@pixi/layers';
import AudioAnalyser from './AudioAnalyser';
import Vizualiser from './Vizualiser';

export default class VizualiserSpiral extends Vizualiser {
    
    constructor(app, audioAnalyser) {
        super(app, audioAnalyser);
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        this.initElements();
    }

    initElements() {
        // Create graphics object for the spiral visualizer
        this.graphics = new PIXI.Graphics();
        this.stage.addChild(this.graphics);
    }

    update() {
        // Get current time for time deltas
        const tick = Date.now();
        const dt = tick - this.lastTick;

        // Clear the graphics
        this.graphics.clear();

        // Get the frequency data from the audio analyser
        const dataArray = new Float32Array(this.audioAnalyser.analyser.frequencyBinCount);
        this.audioAnalyser.analyser.getFloatFrequencyData(dataArray);

        // Draw the spiral visualizer
        this.graphics.lineStyle(2, 0xff66cc, 1);
        let angle = 0;
        let radius = 0;
        const angleIncrement = 0.1;  // Adjust the increment for a smoother spiral
        const radiusIncrement = 0.2;  // Adjust the increment for smoother radius growth

        this.graphics.moveTo(this.centerX, this.centerY);

        for (let i = 0; i < dataArray.length; i++) {
            angle += angleIncrement;
            radius += radiusIncrement + (dataArray[i] / 255) * 2; // Adjust radius based on frequency

            const x = this.centerX + radius * Math.cos(angle);
            const y = this.centerY + radius * Math.sin(angle);

            this.graphics.lineTo(x, y);
        }

        // Rotate the spiral based on frequency sounds
        const highFrequency = this.getHighFrequency(dataArray);
        const rotationAngle = (highFrequency / 128) * Math.PI / 180; // Small angle for rotation
        this.graphics.rotation += rotationAngle * 0.01;

        // Update lastTick
        this.lastTick = tick;
    }

    resize() {
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
    }

    destroy() {
        this.stage.removeChild(this.graphics);
        this.graphics.destroy();
    }

    getHighFrequency(dataArray) {
        // Calculate an average of the higher frequencies
        let sum = 0;
        const startIndex = Math.floor(dataArray.length / 2);
        for (let i = startIndex; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / (dataArray.length - startIndex);
    }
}
