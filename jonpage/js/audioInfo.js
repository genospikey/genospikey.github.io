AudioInfo = function(audio) { 
    
    //frequency Bins
    this.numSlices = 10;
    this.current = [];
    this.max = [];
    this.events = [];
    this.events.length = this.numSlices;
    this.updateEvents = [];

    //data arrays for wave info
    this.dataArrayFreq = [];	
    this.dataArrayWave = [];

    for(var x = 0; x < this.numSlices; x++){
        this.max[x] = 0;
        this.events[x] = new Array(0);
    }

    //create audio context
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    //create analyser object
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;

    //setup audio connections to analyser and output
    this.source = this.audioCtx.createMediaElementSource(audio);
    this.source.connect(this.analyser);
    this.source.connect(this.audioCtx.destination);
    
    //create buffer array
    var bufferLength = this.analyser.frequencyBinCount;
    this.dataArrayFreq = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(this.dataArrayFreq);
    
    //create other buffer array
    this.dataArrayWave = new Uint8Array(this.analyser.fftSize); 
    this.analyser.getByteTimeDomainData(this.dataArrayWave);

    //add audio visualizer update function to ticker
    this.tickerHandle = app.ticker.add((dt)=>{
        this.analyser.getByteFrequencyData(this.dataArrayFreq);
        this.analyser.getByteTimeDomainData(this.dataArrayWave);
        this.update(dt);
    });
};

AudioInfo.prototype.update = function (dt){
    
    for(var x = 0; x<this.numSlices; x++){
        var index = Math.floor(this.dataArrayFreq.length/this.numSlices * x);
        index = Math.floor(Math.pow(x/this.numSlices,3.21928)*this.dataArrayFreq.length);
        var val = 1.12*Math.pow(10,-8)*Math.pow(this.dataArrayFreq[index],3.2);

        this.current[x] = val;

        if(val > this.max[x]){
            this.max[x] = val;

            //fire events
            if(this.events[x].length > 0)
                this.events[x].forEach(e=>{e(dt);});
        }
        else
            this.max[x] = this.max[x] * (1 - dt/5000);
    }

    if(this.updateEvents.length > 0)
        this.updateEvents.forEach(e=>{e(dt);});
};

AudioInfo.prototype.addEvent = function(eventNum, f){
    this.events[eventNum].push(f);
    return this.events[eventNum][this.events[eventNum].length-1];
};

AudioInfo.prototype.removeEvent = function(eventNum, e){
    this.events[eventNum].splice(this.events[eventNum].findIndex(i=>i===e),1);
};

AudioInfo.prototype.addUpdateEvent = function(f){
    this.updateEvents.push(f);
};

AudioInfo.prototype.removeUpdateEvent = function(e){
    this.updateEvents.splice(this.updateEvents.findIndex(i=>i===e),1);
};