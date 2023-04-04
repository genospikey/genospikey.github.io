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
        //draw a square
        this.graphics = new PIXI.Graphics()

        this.graphics.beginFill(0x3333EE)
        this.graphics.drawRect(0, 0, 100, 100)
        
        this.graphics.speed = .25
        this.graphics.vx = this.graphics.speed
        this.graphics.vy = this.graphics.speed

        this.stage.addChild(this.graphics)

    }

    update(){
        //get current time for time deltas
        var tick = Date.now()
        var dt = tick - this.lastTick

        if(this.audioAnalyser.freqArray && this.audioAnalyser.freqArray[3] > this.audioAnalyser.analyser.minDecibels){
            this.graphics.y = this.graphics.y + dt * this.graphics.vy * (this.convertDBtoFloat(this.audioAnalyser.dataArray[1],-50,-10) * 10 + .1)
            this.graphics.x = this.graphics.x + dt * this.graphics.vx * (this.convertDBtoFloat(this.audioAnalyser.dataArray[1],-50,-10) * 10 + .1)
        }
        else{
            this.graphics.y = this.graphics.y + dt * this.graphics.vy
            this.graphics.x = this.graphics.x + dt * this.graphics.vx
        }


        //check for bounce
        if(this.graphics.x < 0) this.graphics.vx = this.graphics.speed
        else if (this.graphics.x > window.innerWidth - 100) this.graphics.vx = -1 * this.graphics.speed 
        if(this.graphics.y < 0) this.graphics.vy = this.graphics.speed
        if(this.graphics.y > window.innerHeight - 100) this.graphics.vy = -1 * this.graphics.speed

        //update lastTick
        this.lastTick = tick
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