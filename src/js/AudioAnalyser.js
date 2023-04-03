// AudioAnalyser - This will take web sources and analyser the output so you can make 
// cool events and stuff
import EventEmitter from "eventemitter3"
import Vizualiser from "./Vizualiser"

export default class AudioAnalyser extends EventEmitter {

    constructor(opts={}){
        super(opts)
        this.fftSize = 32
    }

    start(audioSource){
        //setup audio context
        this.audioCtx =  new window.AudioContext
        
        //create nodes
        this.source = this.audioCtx.createMediaElementSource(audioSource)
        this.gainNode = this.audioCtx.createGain()
        this.analyser = this.audioCtx.createAnalyser()
        
        //connect nodes
        this.source.connect(this.gainNode)
        this.gainNode.connect(this.analyser)
        this.gainNode.connect(this.audioCtx.destination)
        

        //setup nodes
        this.analyser.fftSize = this.fftSize
        this.gainNode.gain.value = 1
        
        //create data arrays
        this.freqArray = new Float32Array(this.analyser.fftSize)
        this.freqArrayMax = new Float32Array(this.analyser.fftSize)

        this.diffFactor = 1.05
        this.decayFactor = 0.01

        this.dataArray = new Float32Array(this.analyser.frequencyBinCount)

        //test ouput
        this.analyser.getFloatTimeDomainData(this.freqArray)
        this.analyser.getFloatFrequencyData(this.dataArray)
    }

    update(){
        this.analyser.getFloatTimeDomainData(this.freqArray)
        this.analyser.getFloatFrequencyData(this.dataArray)

        //get local max and whatnot
        for(let i = 0; i < this.fftSize; i++){
            if(this.freqArrayMax[i] * this.diffFactor < this.freqArray[i]){
                this.freqArrayMax[i] = this.freqArray[i]
                this.emit("beat"+i)
            }
            else
                this.freqArrayMax[i] -= this.decayFactor
        }
    }
}