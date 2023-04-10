import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import * as PIXIUI from '@pixi/ui'
import AudioAnalyser from './AudioAnalyser'
import Vizualiser from './Vizualiser'
import { autoDetectRenderer, Rectangle, RenderTexture } from 'pixi.js'

export default class VizualiserLine extends Vizualiser {

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

        this.graphics = new PIXI.Graphics()
        

        this.graphics.position.set(0, window.innerHeight/2)

        this.drawGraph()  
        
        //draw output sprite
        this.sprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.feedbackSprite = new PIXI.Sprite(this.layer.getRenderTexture())
        this.layer.addChild(this.feedbackSprite)
        
        this.graphics.zOrder = 1
        this.feedbackSprite.zOrder = 0

        this.stage.addChild(this.sprite)
        this.layer.addChild(this.graphics)
    
        fetch('../shaders/shader.glsl')
            .then((res)=>res.text())
            .then((res)=>{this.loadShader(res)})
    }

    update(dt){
        //get previous render texture
        this.drawGraph()

        var f = this.layer.getRenderTexture()
        this.filter.uniforms.uPrevFrame = f._frame
    }

    drawGraph(){
        if(this.audioAnalyser.analyser && this.audioAnalyser.freqArray){
            this.graphics.clear()
            this.graphics.lineStyle(5, 0xFFFFFF)

            var x = 0
            var y = this.audioAnalyser.freqArray[0] * this.maxY

            this.graphics.moveTo(x,y)

            for(let i = 1; i < this.audioAnalyser.analyser.fftSize; i++){
                //var x = i/(this.audioAnalyser.analyser.fftSize-1) * this.maxX
                var x = (i+1)/this.audioAnalyser.analyser.fftSize * this.maxX
                var y = this.audioAnalyser.freqArray[i] * this.maxY
                this.graphics.lineTo(x,y)
            }
        }
    }

    loadShader(data){
        var f = this.layer.getRenderTexture()
        this.filter = new PIXI.Filter(null,data,{fDelta: 1.0, uPrevFrame:f._frame, fConvolutionFactor:0.01})
        this.feedbackSprite.filters = [this.filter]

        //create debug ui
        this.createDebugUI()
    }
    
    createDebugUI(){
        var style = new PIXI.TextStyle({
            fontFamily:'Silkscreen',
            fontSize:14,
            fill:0xffff00,
            align: 'right',
        })

        var sliderList = []
        sliderList[0] = {
            name:'fConvolutionFactor', 
            min:0.0, 
            max:0.01,
            f:(value)=>{this.filter.uniforms.fConvolutionFactor = value; this.sliders[0].text.text = value},
        }

        this.sliders = []
        for(let i=0;i<sliderList.length;i++){
            var e = sliderList[i]
            var slider = new PIXIUI.Slider({
                bg: 'sliderbg.png',
                fill: 'sliderfill.png',
                slider: 'slider.png',
                min: e.min, 
                max: e.max,
                value: e.min,
            })
            this.stage.addChild(slider)
            slider.position.set(50,125 + i*50)
            slider.onUpdate.connect(e.f)

            this.sliders[i] = slider
            
            var t = new PIXI.Text(e.min, style)
            this.stage.addChild(t)
            t.position.set(325, 125 + i*50)
            
            this.sliders[i].text = t
        }
    }
}