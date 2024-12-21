import * as PIXI from 'pixi.js';
import * as PIXILayers from '@pixi/layers';
import Vizualiser from './Vizualiser';
import { autoDetectRenderer } from 'pixi.js';

export default class VizualiserShaderBase extends Vizualiser {

    constructor(app, audioAnalyser) {
        super(app, audioAnalyser);
    }

    initElements() {
        
        this.minX = 0
        this.minY = 0
        this.maxX = window.innerWidth
        this.maxY = window.innerHeight

        this.renderer = autoDetectRenderer();

        // Setup layer
        this.layer = new PIXILayers.Layer();
        this.stage.addChild(this.layer);

        this.layer.useRenderTexture = true;
        this.layer.useDoubleBuffer = true;

        // Draw output sprite
        this.sprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.stage.addChild(this.sprite)

        this.feedbackSprite = new PIXI.Sprite(this.layer.getRenderTexture());
        this.layer.addChild(this.feedbackSprite);

        this.feedbackSprite.zOrder = -1;
    }

    fetchAndLoadShader(shaderPath, uniforms) {
        console.log(uniforms)
        fetch(shaderPath)
            .then((res) => res.text())
            .then((res) => { this.loadShader(res,uniforms); });
    }

    loadShader(data, uniforms = {}) {
        var f = this.layer.getRenderTexture();
        uniforms.uPrevFrame = f;
        
        this.filter = new PIXI.Filter(null, data, uniforms);
        this.feedbackSprite.filters = [this.filter];
    }

    update(dt) {
        // Get previous render texture
        if(this.filter){
            var fTime = (Date.now() / 1000.0); // Convert to seconds and mod by 2π
            this.filter.uniforms.fTime = fTime;
    
            var f = this.layer.getRenderTexture();
            this.filter.uniforms.uPrevFrame = f._frame;
        }
    }

    destroy() {
        // Remove graphics and sprites from the stage
        this.stage.removeChild(this.sprite);
        this.sprite.destroy({ children: true, texture: true, baseTexture: true });

        // Remove graphics and sprites from the stage
        this.stage.removeChild(this.feedbackSprite);
        this.feedbackSprite.destroy({ children: true, texture: true, baseTexture: true });

        // Remove layer from the stage
        this.stage.removeChild(this.layer);
        this.layer.destroy({ children: true, texture: true, baseTexture: true });

        // Call parent destroy if necessary
        super.destroy();
    }
}
