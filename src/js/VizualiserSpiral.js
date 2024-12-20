import * as PIXI from 'pixi.js';
import * as PIXILayers from '@pixi/layers';
import * as PIXIUI from '@pixi/ui';
import AudioAnalyser from './AudioAnalyser';
import Vizualiser from './Vizualiser';
import { autoDetectRenderer, Rectangle, RenderTexture } from 'pixi.js';

const ANGLE_INCREMENT = 0.1;
const RADIUS_INCREMENT = 2;
const LINE_THICKNESS = 2;
const LINE_COLOR = 0xff66cc;
const LINE_ALPHA = 1;
const ROTATION_BEAT_INCREMENT = Math.PI / 36;
const ROTATION_EASE_SPEED = 0.05;

export default class VizualiserSpiral extends Vizualiser {
    
    constructor(app, audioAnalyser) {
        super(app, audioAnalyser);
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        this.rotationAngle = 0;
        this.targetRotationAngle = 0;
        this.initElements();
        this.setupBeatListeners();
    }

    initElements() {
        this.renderer = autoDetectRenderer();
        this.line_color = LINE_COLOR;

        // Setup layer
        this.layer = new PIXILayers.Layer();
        this.stage.addChild(this.layer);

        this.layer.useRenderTexture = true;
        this.layer.useDoubleBuffer = true;

        this.filter = new PIXI.Filter();

        this.graphics = new PIXI.Graphics();

        //draw output sprite
        this.sprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.feedbackSprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.layer.addChild(this.feedbackSprite)
        
        this.graphics.zOrder = 1
        this.feedbackSprite.zOrder = 0

        this.stage.addChild(this.sprite)
        this.layer.addChild(this.graphics)

        fetch('../shaders/shaderAI6.glsl')
            .then((res) => res.text())
            .then((res) => { this.loadShader(res); });
    }

    update(dt) {
        if (!this.filter) return;
    
        // Update time uniform
        var angle = Date.now().toFixed(2)/1000.0 % (Math.PI * 2.0) ; // Convert to seconds
        this.filter.uniforms.fTime = angle;
        // Existing drawing logic
        this.drawSpiral();
    
        // Easing rotation angle towards the target
        this.rotationAngle += (this.targetRotationAngle - this.rotationAngle) * ROTATION_EASE_SPEED;
    
        // Update shader with the current frame texture
        const renderTexture = this.layer.getRenderTexture();
        this.filter.uniforms.uPrevFrame = renderTexture;
        this.feedbackSprite.filters = [this.filter];
    }
    

    drawSpiral() {
        if (this.graphics && this.audioAnalyser.analyser) {
            const dataArray = new Float32Array(this.audioAnalyser.analyser.frequencyBinCount);
            this.audioAnalyser.analyser.getFloatFrequencyData(dataArray);

            this.graphics.clear();
            this.graphics.lineStyle(LINE_THICKNESS, this.line_color, LINE_ALPHA);

            let angle = 0;
            let radius = 0;
            this.graphics.moveTo(this.centerX, this.centerY);

            for (let i = 0; i < dataArray.length * 10; i++) {
                angle += ANGLE_INCREMENT;
                radius += RADIUS_INCREMENT;

                const adjustedAmplitude = this.convertDBtoFloat(dataArray[i % dataArray.length], 
                    this.audioAnalyser.dataArrayMin[i % dataArray.length], 
                    this.audioAnalyser.dataArrayMax[i % dataArray.length])*radius/4.0;

                const baseX = this.centerX + radius * Math.cos(angle + this.rotationAngle);
                const baseY = this.centerY + radius * Math.sin(angle + this.rotationAngle);

                const nextAngle = angle + ANGLE_INCREMENT;
                const nextRadius = radius + RADIUS_INCREMENT;
                const nextX = this.centerX + nextRadius * Math.cos(nextAngle + this.rotationAngle);
                const nextY = this.centerY + nextRadius * Math.sin(nextAngle + this.rotationAngle);

                const tangentX = nextX - baseX;
                const tangentY = nextY - baseY;
                const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
                const normalizedTangentX = tangentX / length;
                const normalizedTangentY = tangentY / length;
                const perpendicularX = -normalizedTangentY;
                const perpendicularY = normalizedTangentX;
                const waveX = baseX + adjustedAmplitude * perpendicularX;
                const waveY = baseY + adjustedAmplitude * perpendicularY;

                this.graphics.lineTo(waveX, waveY);
            }
        }
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
        let sum = 0;
        const startIndex = Math.floor(dataArray.length / 2);
        for (let i = startIndex; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / (dataArray.length - startIndex);
    }

    convertDBtoFloat(DB, min, max) {
        const minDB = min ? min : this.audioAnalyser.analyser.minDecibels;
        const maxDB = max ? max : this.audioAnalyser.analyser.maxDecibels;
        return Math.max((DB - minDB) / (maxDB - minDB), 0);
    }

    setupBeatListeners() {
        for (let i = 0; i < this.audioAnalyser.analyser.frequencyBinCount; i++) {
            this.audioAnalyser.on('beat' + i, () => {
                this.targetRotationAngle += ROTATION_BEAT_INCREMENT;
            });
        }
    }

    loadShader(data) {
        this.filter = new PIXI.Filter(null, data, {
            fTime: 0.0,
            fConvolutionFactor: 0.1,
            uPrevFrame: PIXI.Texture.EMPTY,
        });

        this.feedbackSprite.filters = [this.filter];
    }
}
