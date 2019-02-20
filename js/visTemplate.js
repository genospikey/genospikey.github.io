Visualizer = function(audioInfo){
    this.name = 'Nice and Simple';
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.waveformSprite = new PIXI.Sprite();
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
    this.colorShift = new ColorShift();
};

//create assets required when stage is created
Visualizer.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;
    this.waveformSprite.anchor.set(0.5,0.5);
    this.waveformSprite.x = WindowWidth/2;
    this.waveformSprite.y = WindowHeight/2;
    this.waveformSprite.scale.y = 1;
    this.waveformSprite.scale.x = 1;

    //add sprite to container
    stage.addChild(this.waveformSprite);

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent(()=>{
        this.update();
    });

    helpText.text = 'Just a basic visualizer waveform';
}

//stop visualizer functions that dont stop when events are stopped
Visualizer.prototype.stop = function(){

}

//destroy all things related to the visualizer
Visualizer.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    
    //destroy all assets
    this.waveformSprite.destroy({children:true, texture:true, baseTexture:true});
    this.container.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
Visualizer.prototype.resize = function(){
    
    //set location of waveform sprite
    if(this.waveformSprite){
        this.waveformSprite.x = WindowWidth/2;
        this.waveformSprite.y = WindowHeight/2;
    }
}

//update the waveform information
Visualizer.prototype.update = function(){

    //colorshifting
    this.colorShift.step();
    
    //set num segments
    var segments = 200;
    
    // set a fill and line style
    this.waveform.clear();
    this.waveform.beginFill(Math.floor(Math.random() * 0xFFFFFF));
    this.waveform.fillAlpha = 0;
    this.waveform.lineStyle(5, this.colorShift.current, 1);
    // draw waveform
    for(x = 0; x < segments; x++){
        var index = Math.min(Math.floor(x*this.audioInfo.dataArrayWave.length/segments),this.audioInfo.dataArrayWave.length-1);
        var y = (this.audioInfo.dataArrayWave[index]/128)*WindowWidth/4;
        
        //draw segment
        if(x==0)
            this.waveform.moveTo(0,y);
        else
            this.waveform.lineTo(x/segments*WindowWidth,y);
    }

    this.waveform.endFill();
    var waveformTexture = app.renderer.generateTexture(this.waveform);
    var waveformTexturePrev = this.waveformSprite.texture;
    this.waveformSprite.texture = waveformTexture;
    waveformTexturePrev.destroy(true);    
}

ColorShift = function(){
    this.current = Math.round(Math.random() * 0xFFFFFF);
    this.target = Math.round(Math.random() * 0xFFFFFF);
    this.stepSpeed = 1;
}

ColorShift.prototype.step = function(){
    var currentR = (this.current >> 16) & 255;
    var currentG = (this.current >> 8) & 255;
    var currentB = (this.current) & 255;

    var targetR = (this.target >> 16) & 255;
    var targetG = (this.target >> 8) & 255;
    var targetB = (this.target) & 255;

    // console.log('Current R: ' + currentR + ' G: ' + currentG + ' B: ' + currentB);
    // console.log('Target R: ' + targetR + ' G: ' + targetG + ' B: ' + targetB);
    // console.log(this.current);

    for(var x = 0; x < this.stepSpeed; x++){
        
        if(currentR < targetR) currentR += 1;
        if(currentR > targetR) currentR -= 1;
        if(currentB < targetB) currentB += 1;
        if(currentB > targetB) currentB -= 1;
        if(currentG < targetG) currentG += 1;
        if(currentG > targetG) currentG -= 1;        
    }

    // console.log('R: ' + currentR + ' G: ' + currentG + ' B: ' + currentB);
    this.current = (currentR << 16) + (currentG << 8) + currentB;
    // console.log(this.current);

    if(this.current == this.target)
        this.target = Math.floor(Math.random() * 0xFFFFFF);
}