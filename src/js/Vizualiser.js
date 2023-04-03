import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import AudioAnalyser from './AudioAnalyser'

export default class Vizualiser{
    
    constructor(app, audioAnalyser){
        this.stage = new PIXILayers.Stage()
        this.app = app
        this.audioAnalyser = audioAnalyser

        //create layers
        var bgContainer = new PIXI.Container()
        this.stage.addChild(bgContainer)

        var container = new PIXI.Container()
        this.stage.addChild(container)

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
        
        this.graphics.vx = 0.1
        this.graphics.vy = 0.1

        this.stage.addChild(this.graphics)

    }

    update(){
        //get current time for time deltas
        var tick = Date.now()
        var dt = tick - this.lastTick

        this.graphics.y = this.graphics.y + dt * this.graphics.vy 
        this.graphics.x = this.graphics.x + dt * this.graphics.vx

        //check for bounce
        if(this.graphics.x < 0 || this.graphics.x > window.innerWidth - 100) this.graphics.vx *= -1 * (.9 + .1 * Math.random())
        if(this.graphics.y < 0 || this.graphics.y > window.innerHeight - 100) this.graphics.vy *= -1 * (.9 + .1 * Math.random())

        //update lastTick
        this.lastTick = tick
    }

    destroy(){

    }
}