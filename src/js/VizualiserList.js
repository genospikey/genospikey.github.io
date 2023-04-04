import Vizualiser from './Vizualiser'
import VizualiserLine from './VizualiserLine'

export default class VizualiserList {
    
    constructor(){
        this.list = []
        this.list[0] = {class: Vizualiser, name: 'Bounce', description: 'Be mesmerized by the bouncing square...'}
        this.list[1] = {class: VizualiserLine, name: 'Oscilloscope', description: 'A basic spectrograph thing'}
    }
}