import Vizualiser from './Vizualiser'
import VizualiserLine from './VizualiserLine'
import ViziualiserDebug from './VizualiserDebug'
import VizualiserPolar from './VizualiserPolar'

export default class VizualiserList {
    
    constructor(){
        this.list = []
        this.list[0] = {class: Vizualiser, name: 'Bounce', description: 'Be mesmerized by the bouncing square...'}
        this.list[1] = {class: VizualiserLine, name: 'Oscilloscope', description: 'A basic spectrograph thing'}
        this.list[2] = {class: ViziualiserDebug, name: 'Debug', description: 'Here\'s a bunch of debug stuff.'}
        this.list[3] = {class: VizualiserPolar, name: 'Polar', description: 'It\s a big ole circle'}
    }
}