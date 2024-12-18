import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import AudioAnalyser from './AudioAnalyser'
import Vizualiser from './Vizualiser'


export default class VizualiserDebug extends Vizualiser {
    
    constructor (app, audioAnalyser){
        super(app, audioAnalyser)
    }

    //helper stuff
    drawGraph(width, height){
        if(this.audioAnalyser.analyser && this.audioAnalyser.freqArray){
            this.graph.clear()
            this.graph.lineStyle(2, 0xFFFFFF)

            var x = 0
            var y = this.audioAnalyser.freqArray[0] * height
            this.graph.moveTo(x,y)

            for(let i = 1; i < this.audioAnalyser.analyser.fftSize; i++){
                //var x = i/(this.audioAnalyser.analyser.fftSize-1) * this.maxX
                var x = (i+1)/this.audioAnalyser.analyser.fftSize * width
                var y = this.audioAnalyser.freqArray[i] * height
                this.graph.lineTo(x,y)
            }
        }
    }

    drawBars(width, height){
        this.bars.clear()
        var barWidth = 2/3 * width / this.audioAnalyser.dataArray.length
        var barSpacing = 1/3 * width / (this.audioAnalyser.dataArray.length - 1)
        for(let i=0;i<this.audioAnalyser.dataArray.length;i++){
            var barHeight = height * this.convertDBtoFloat(
                this.audioAnalyser.dataArray[i],
                this.audioAnalyser.dataArrayMin[i],
                this.audioAnalyser.dataArrayMax[i])

            this.bars.beginFill(0xff0000)
            this.bars.drawRect((barWidth + barSpacing) * i, height-barHeight, barWidth, barHeight)
        }
    }

    updateBeats(dt){
        for(let i=0;i<this.beats.length;i++){
            if(this.beats[i].scale.x > 1){
                this.beats[i].scale.x-= .051 * dt
                this.beats[i].scale.y-= .051 * dt
            }
            if(this.beats[i].scale.x < 1){
                this.beats[i].scale.x = 1
                this.beats[i].scale.y = 1
            }
        }
    }

    handleBeat(index){
        this.beats[index].scale.x = 1.8
        this.beats[index].scale.y = 1.8
    }

    formatArray(arr){
        var text = ''
        
        for(let i=0;i<arr.length;i++)
            text+=arr[i].toFixed(3) +'\n'

        return text
    }

    updateTextValues(){
        this.freqArray.text = this.formatArray(this.audioAnalyser.freqArray)
        this.freqArrayMax.text = this.formatArray(this.audioAnalyser.freqArrayMax)
        this.dataArray.text = this.formatArray(this.audioAnalyser.dataArray)
        this.dataArrayMax.text = this.formatArray(this.audioAnalyser.dataArrayMax)
        this.dataArrayMin.text = this.formatArray(this.audioAnalyser.dataArrayMin)
    }

    //required functions
    
    initElements(){
        if(this.audioAnalyser.freqArray){
            //create printable fonts
                    
            var style = new PIXI.TextStyle({
                fontFamily:'Silkscreen',
                fontSize:10,
                fill:0xffff00,
                align: 'right',
            })

            //setup text output
            this.textContainer = new PIXI.Container()
            this.textContainer.position.set(50,125)
            this.stage.addChild(this.textContainer)

            this.freqArray = new PIXI.Text(this.formatArray(this.audioAnalyser.freqArray),style)
            this.freqArray.position.set(0,0)

            this.freqArrayMax = new PIXI.Text(this.formatArray(this.audioAnalyser.freqArrayMax),style)
            this.freqArrayMax.position.set(80,0)

            this.dataArray = new PIXI.Text(this.formatArray(this.audioAnalyser.dataArray),style)
            this.dataArray.position.set(160,0)

            this.dataArrayMax = new PIXI.Text(this.formatArray(this.audioAnalyser.dataArrayMax),style)
            this.dataArrayMax.position.set(340,0)

            this.dataArrayMin = new PIXI.Text(this.formatArray(this.audioAnalyser.dataArrayMin),style)
            this.dataArrayMin.position.set(240,0)

            this.textContainer.addChild(this.freqArray)
            this.textContainer.addChild(this.freqArrayMax)
            this.textContainer.addChild(this.dataArray)
            this.textContainer.addChild(this.dataArrayMax)
            this.textContainer.addChild(this.dataArrayMin)

            //create graph
            this.graph = new PIXI.Graphics()
            this.stage.addChild(this.graph)

            this.graph.position.set(500,250)
            this.drawGraph(300,200)

            //create bars
            this.barContainer = new PIXI.Container()
            this.stage.addChild(this.barContainer)

            this.barContainer.position.set(500,450)

            this.bars = new PIXI.Graphics()
            this.barContainer.addChild(this.bars)

            this.drawBars(300,300)

            //create boxes for beat events
            this.beatContainer = new PIXI.Container()
            this.stage.addChild(this.beatContainer)

            this.beatContainer.position.set(200,375)

            this.events = []
            this.beats = []

            for(let i = 0; i < this.audioAnalyser.dataArray.length; i++){
                var beat = new PIXI.Graphics()
                this.beats[i] = beat
                this.beatContainer.addChild(beat)
                beat.beginFill(0x0000FF)
                beat.drawRect(0,0,10,10)
                beat.position.set(i*15,0)

                this.audioAnalyser.on('beat'+i,this.events[i]=()=>{this.handleBeat(i)})
            }
        }
    }

    update(dt){
        if(this.audioAnalyser.freqArray){
            if(!this.textContainer)
                this.initElements()
            this.updateTextValues()
            this.drawGraph(300,200)
            this.drawBars(300,300)
            this.updateBeats(dt)
        }
    }

    resize(){}

    destroy(){
        for(let i = 0; i < this.audioAnalyser.dataArray.length; i++)
            this.audioAnalyser.removeListener('beat'+i,this.events[i])
    }

}