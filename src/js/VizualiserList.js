import Vizualiser from './Vizualiser';
import VizualiserSquare from './VizualiserSquare';
import VizualiserLine from './VizualiserLine';
import ViziualiserDebug from './VizualiserDebug';
import VizualiserPolar from './VizualiserPolar';
import VizualiserSpiral from './VizualiserSpiral';
import VizualiserAI from './VizualiserAI';
import VizualiserAI2 from './VizualiserAI2';
import VizualiserLeftWaveform from './VizualiserLeftWaveform'; // Import the new class

export default class VizualiserList {
    
    constructor() {
        this.list = [];
        this.list[0] = {class: VizualiserSquare, name: 'Bounce', description: 'Be mesmerized by the bouncing square...'};
        this.list[1] = {class: VizualiserLine, name: 'Oscilloscope', description: 'A basic spectrograph thing'};
        this.list[2] = {class: ViziualiserDebug, name: 'Debug', description: 'Here\'s a bunch of debug stuff.'};
        this.list[3] = {class: VizualiserPolar, name: 'Polar', description: 'It\'s a big ole circle'};
        this.list[4] = {class: VizualiserSpiral, name: 'Spiral', description: 'A dynamic spiral visualizer that reacts to frequencies'};
        this.list[5] = {class: VizualiserAI, name: 'AI', description: 'AI Generated Nonsense'};
        this.list[6] = {class: VizualiserAI2, name: 'Balls', description: 'AI Generated Nonsense 2'};
        this.list[7] = {class: VizualiserLeftWaveform, name: 'Left Waveform', description: 'A vertical waveform on the left side of the screen'};
    }
}
