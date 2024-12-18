import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import AudioAnalyser from './AudioAnalyser'

export default class Vizualiser{
    
    constructor(app, audioAnalyser){
        this.stage = new PIXILayers.Stage()
        
        this.app = app
        this.audioAnalyser = audioAnalyser

        this.bgColor = 0x000000
        this.lastTick = Date.now()
        this.tickTime = 16

        //draw background
        var bg = new PIXI.Graphics()
        bg.beginFill(this.bgColor)
        bg.drawRect(0,0,window.innerWidth,window.innerHeight)
        this.stage.addChild(bg)

        this.initElements()
    }

    initElements(){
    }

    update(){
    }

    destroy(){
    }

    resize(){
        this.graphics.y = Math.max(0, Math.min(window.innerHeight - 100,this.graphics.y))
        this.graphics.x = Math.max(0, Math.min(window.innerWidth - 100,this.graphics.x))
    }

    convertDBtoFloat(DB, min, max){

        var minDB = min?min:this.audioAnalyser.analyser.minDecibels
        var maxDB = max?max:this.audioAnalyser.analyser.maxDecibels
        
        return Math.max((DB - minDB) / (maxDB - minDB),0)
    }
}