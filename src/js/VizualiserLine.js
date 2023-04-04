import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import AudioAnalyser from './AudioAnalyser'
import Vizualiser from './Vizualiser'

export default class VizualiserLine extends Vizualiser {

    constructor (app, audioAnalyser){
        super(app, audioAnalyser)
    }

    initElements(){
        
        this.minX = 0
        this.minY = 0
        this.maxX = window.innerWidth
        this.maxY = window.innerHeight  

        //create graphics for spectrograph
        this.graphics = new PIXI.Graphics()
        this.stage.addChild(this.graphics)

        this.graphics.position.set(0, window.innerHeight/2)

        this.drawGraph()  
    }

    update(dt){
        this.drawGraph()
    }

    drawGraph(){
        if(this.audioAnalyser.analyser && this.audioAnalyser.freqArray){
            this.graphics.clear()
            this.graphics.lineStyle(2, 0xFFFFFF)

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
}