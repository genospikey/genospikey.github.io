import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import * as PIXIUI from '@pixi/ui'
import AudioAnalyser from './AudioAnalyser'
import Vizualiser from './Vizualiser'
import { autoDetectRenderer, Rectangle, RenderTexture } from 'pixi.js'

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export default class VizualiserAI extends Vizualiser {

    constructor (app, audioAnalyser){
        super(app, audioAnalyser)
    }

    initElements(){
        this.renderer = autoDetectRenderer()
        
        //setup layer
        this.layer = new PIXILayers.Layer()
        this.stage.addChild(this.layer)

        this.layer.useRenderTexture = true
        this.layer.useDoubleBuffer = true

        this.minX = 0
        this.minY = 0
        this.maxX = window.innerWidth
        this.maxY = window.innerHeight
        
        this.filter = new PIXI.Filter()
        
        //draw output sprite
        this.sprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.feedbackSprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.layer.addChild(this.feedbackSprite)
        
        this.feedbackSprite.zOrder = -1

        this.stage.addChild(this.sprite)
    
        fetch('../shaders/shaderAIBoil.glsl')
            .then((res)=>res.text())
            .then((res)=>{this.loadShader(res)})

        this.cubes = [];
        this.speedFactor = 1;
        this.rotationSpeedFactor = 1;
        this.decayRate = 0.02;
        
        for (let i = 0; i < this.audioAnalyser.dataArray.length; i++) {
            const size = Math.random() * 50 + 20; // random size between 10 and 30
            const cube = new PIXI.Graphics();
            const baseColor = 0x0000FF; // Example base color (blue)
            const variation = Math.floor((size / 30) * 0xFFFFFF); // Generate color variation based on size
            const newColor = (baseColor + variation) % 0xFFFFFF; // Ensure the color is within the valid range
            cube.beginFill(newColor);
            cube.drawRect(0, 0, size, size);
            cube.endFill();
            cube.pivot.set(size / 2, size / 2);
            cube.position.set(Math.random() * this.app.screen.width, Math.random() * this.app.screen.height);
            this.layer.addChild(cube);
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
        console.log("onbeat")
        this.cubes[index].speed *= 1.5;
        this.cubes[index].rotationSpeed *= 1.5;
    }

    update(delta) {

        this.filter.uniforms.fTime = (this.filter.uniforms.fTime + delta * 0.001);
        this.filter.uniforms.fBubbleIntensity = Math.sin((Date.now() / 10000.0))*10.0

        for (let i = 0; i < this.cubes.length; i++) {
           
            const { cube, speed, rotationSpeed } = this.cubes[i];
            // Clamp speed and rotation speed 
            
            this.cubes[i].speed = clamp(this.cubes[i].speed, 0.5, 7); 
            this.cubes[i].rotationSpeed = clamp(this.cubes[i].rotationSpeed, 0.005, 0.20);
                        
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

    destroy() {
        for (let { cube } of this.cubes) {
            this.app.stage.removeChild(cube);
            cube.destroy();
        }

        super.destroy();
    }
    
    loadShader(data) {
        var f = this.layer.getRenderTexture();
        this.filter = new PIXI.Filter(null, data, { 
            uPrevFrame: f, fConvolutionFactor: 0.001, fTime: 0.0, fBubbleIntensity: 1.0});
        this.feedbackSprite.filters = [this.filter];
    }
    
}
