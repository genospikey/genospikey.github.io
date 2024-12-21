import VizualiserShaderBase from './VizualiserShaderBase';
import * as PIXI from 'pixi.js';

export default class VizualiserLeftWaveform extends VizualiserShaderBase {

    constructor(app, audioAnalyser) {
        super(app, audioAnalyser);
    }

    initElements() {
        const shaderPath = '../shaders/shaderAIWater.glsl'; // Specify your shader path
        const uniforms = { fTime: 0.0, fConvolutionFactor: 0.01 };
        super.initElements();
        
        this.graphics = new PIXI.Graphics();
        this.graphics.position.set(20, 0); // Position the graphics at the left side of the screen
        this.layer.addChild(this.graphics);
        this.drawGraph();

        fetchAndLoadShader(shaderPath,uniforms);
    }

    drawGraph() {
        if (this.audioAnalyser.analyser && this.audioAnalyser.freqArray) {
            this.graphics.clear();
            this.graphics.lineStyle(5, 0xFFFFFF);

            var y = this.audioAnalyser.freqArray[0] * this.maxY;

            this.graphics.moveTo(0, y);

            for (let i = 1; i < this.audioAnalyser.analyser.fftSize; i++) {
                var x = 0;
                var y = (i / this.audioAnalyser.analyser.fftSize) * this.maxY;
                var intensity = this.audioAnalyser.freqArray[i] * this.maxY;
                this.graphics.lineTo(intensity, y);
            }
        }
    }

    update(dt) {
        // Draw graph first before updating shader uniforms
        this.drawGraph();

        super.update(dt);
    }
}
