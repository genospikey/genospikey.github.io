/**
 * AudioAnalyser
 * 
 * The `AudioAnalyser` class processes audio data and provides real-time analysis for visualizations.
 * 
 * - Initialization:
 *   - Sets up an audio context and creates nodes for source, gain, and analyser.
 *   - Connects the audio nodes and initializes arrays for frequency and time-domain data.
 * 
 * - Start Method:
 *   - Connects the audio source and starts processing the audio data.
 *   - Configures the analyser node for frequency and time-domain analysis.
 * 
 * - Update Method:
 *   - Continuously updates the frequency and time-domain data arrays.
 *   - Maintains local minimum and maximum values for frequency and time-domain data to detect beats and other audio features.
 * 
 * - Event Emission:
 *   - Emits "beat" events whenever a beat is detected based on the frequency data.
 *   - Allows visualizers to react to beats by tying functions to these events.
 * 
 * - Data Arrays:
 *   - `dataArray`: Frequency data.
 *   - `dataArrayMin`: Local minimum values of `dataArray`.
 *   - `dataArrayMax`: Local maximum values of `dataArray`.
 *   - `freqArray`: Time-domain signal data.
 *   - `freqArrayMax`: Local maximum values of `freqArray`.
 * 
 * By analyzing the audio data and providing detailed frequency and time-domain information,
 * the `AudioAnalyser` class enables dynamic and responsive audio visualizations.
 */

import EventEmitter from "eventemitter3"

export default class AudioAnalyser extends EventEmitter {
    
    

    constructor(opts={}){
        super(opts)
        this.inc = 0
        this.fftSize = 32
        this.status = 'waiting for input'
    }

    start(audioSource){
        this.status = 'running'
        
        //setup audio context
        this.audioCtx =  new window.AudioContext
        
        //create nodes
        if(!this.source)
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

        this.diffFactor = 0.9
        this.decayFactor = 0.01
        this.minDecayFactor = 0.005

        this.dataArray = new Float32Array(this.analyser.frequencyBinCount)
        this.dataArrayMax = new Float32Array(this.analyser.frequencyBinCount)
        this.dataArrayMin = new Float32Array(this.analyser.frequencyBinCount)

        //test ouput
        this.analyser.getFloatTimeDomainData(this.freqArray)
        this.analyser.getFloatFrequencyData(this.dataArray)

        this.analyser.getFloatTimeDomainData(this.freqArrayMax)
        this.analyser.getFloatFrequencyData(this.dataArrayMax)
        this.analyser.getFloatFrequencyData(this.dataArrayMin)
    }

    update(delta){
        if(this.audioCtx){
            this.analyser.getFloatTimeDomainData(this.freqArray)
            this.analyser.getFloatFrequencyData(this.dataArray)
    
            //get local max and whatnot
            for(let i = 0; i < this.fftSize; i++){
                if(this.freqArrayMax[i] * this.diffFactor < this.freqArray[i]){
                    this.freqArrayMax[i] = this.freqArray[i]
                }
                else
                    this.freqArrayMax[i] -= this.decayFactor * delta
            }
            
            for(let i = 0; i < this.analyser.frequencyBinCount; i++){
                if(this.dataArrayMax[i] < this.dataArray[i]){
                    this.dataArrayMax[i] = this.dataArray[i]
                    
                    this.emit("beat"+i)
                }
                else
                    this.dataArrayMax[i] -= this.decayFactor * delta
            }

            for(let i = 0; i < this.analyser.frequencyBinCount; i++){
                if(this.dataArrayMin[i] > this.dataArray[i] 
                    || this.dataArrayMin[i] === Number.NEGATIVE_INFINITY)
                    this.dataArrayMin[i] = this.dataArray[i]
                else{
                    this.dataArrayMin[i] += this.minDecayFactor * delta
                    if(this.dataArrayMin[i] < this.dataArrayMax[i]-70)
                        this.dataArrayMin[i] = this.dataArrayMax[i]-70 
                }
            }
 
        }
        this.inc++
    }
}