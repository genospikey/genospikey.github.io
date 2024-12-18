import * as PIXI from 'pixi.js'
import * as PIXILayers from '@pixi/layers'
import AudioAnalyser from './AudioAnalyser'
import Vizualiser from './Vizualiser'

export default class VizualiserPolar extends Vizualiser {

    initElements(){
        //make circle boxes
        this.graphics = new PIXI.Graphics()
        this.stage.addChild(this.graphics)
        
        this.graphics.position.set(window.innerWidth/2, window.innerHeight/2)
    }

    update(dt){
        //update circle boxes
        if(this.audioAnalyser.dataArray){
            this.graphics.clear()
            this.graphics.lineStyle(2, 0xFFFFFF)

            for(let i=0;i<this.audioAnalyser.dataArray.length;i++){
                var height = this.convertDBtoFloat(
                    this.audioAnalyser.dataArray[i],
                    this.audioAnalyser.dataArrayMin[i],
                    this.audioAnalyser.dataArrayMax[i])

                var p = this.convertPolarToXY(20,2*Math.PI/this.audioAnalyser.dataArray.length*i)
                this.graphics.moveTo(p.x,p.y)

                p = this.convertPolarToXY(20+300*height,2*Math.PI/this.audioAnalyser.dataArray.length*i)
                this.graphics.lineTo(p.x,p.y)

                p = this.convertPolarToXY(20+300*height,2*Math.PI/this.audioAnalyser.dataArray.length*(i+1)-(.05))
                this.graphics.lineTo(p.x, p.y)

                p = this.convertPolarToXY(20,2*Math.PI/this.audioAnalyser.dataArray.length*(i+1)-(.05))
                this.graphics.lineTo(p.x, p.y)

                p = this.convertPolarToXY(20,2*Math.PI/this.audioAnalyser.dataArray.length*i)
                this.graphics.lineTo(p.x, p.y)
            }
        }
    }

    destroy(){

    }

    convertPolarToXY(r,theta){
        return {
            x:r*Math.cos(theta), 
            y:r*Math.sin(theta)
        }
    }
}