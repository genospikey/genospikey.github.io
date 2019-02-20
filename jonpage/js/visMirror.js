VisualizerMirror = function(audioInfo){
    this.name = 'Mirror Universe';

    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.waveformSprite = new PIXI.Sprite();
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
    this.colorShift = new ColorShift();

    this.trailLength = 100;
    this.waveformHistory = new Array(this.trailLength);
    this.waveformHistoryTopSprites = new Array(this.trailLength);
    this.waveformHistoryBottomSprites = new Array(this.trailLength);
};

//create assets required when stage is created
VisualizerMirror.prototype.start = function(stage){
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

    for(var x = 0; x<this.trailLength; x++){
        //top srpites
        this.waveformHistoryTopSprites[x] = new PIXI.Sprite();
        this.waveformHistoryTopSprites[x].anchor.set(0.5,0);
        this.waveformHistoryTopSprites[x].x = WindowWidth/2;
        this.waveformHistoryTopSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryTopSprites[x].y -= x * WindowWidth/200;

        //bottom sprites
        this.waveformHistoryBottomSprites[x] = new PIXI.Sprite();
        this.waveformHistoryBottomSprites[x].anchor.set(0.5,0);
        this.waveformHistoryBottomSprites[x].x = WindowWidth/2;
        this.waveformHistoryBottomSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryBottomSprites[x].y += x * WindowWidth/200;

        this.waveformHistoryBottomSprites[x].scale.y = -1;


        //add sprite to container
        stage.addChild(this.waveformHistoryTopSprites[x]);
        stage.addChild(this.waveformHistoryBottomSprites[x]);
    } 

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent(()=>{
        this.update();
    });
}

//stop visualizer functions that dont stop when events are stopped
VisualizerMirror.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerMirror.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    
    //destroy all assets
    this.waveformSprite.destroy({children:true, texture:true, baseTexture:true});
    this.waveformHistoryTopSprites.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.waveformHistoryBottomSprites.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.waveformHistory.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.container.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisualizerMirror.prototype.resize = function(){
    
    //set location of waveform sprite
    if(this.waveformSprite){
        this.waveformSprite.x = WindowWidth/2;
        this.waveformSprite.y = WindowHeight/2;
    }
}

//update the waveform information
VisualizerMirror.prototype.update = function(){

    //colorshifting
    this.colorShift.step();
    
    //set num segments
    var segments = 200;
    
    // set a fill and line style
    this.waveform.clear();
    this.waveform.beginFill(this.colorShift.current);
    this.waveform.fillAlpha = 1;
    this.waveform.lineStyle(10, this.colorShift.current, 1);
    this.waveform.moveTo(WindowWidth,WindowHeight);
    this.waveform.lineTo(0,WindowHeight);
    // draw waveform
    for(x = 0; x < segments; x++){
        var index = Math.min(Math.floor(x*this.audioInfo.dataArrayWave.length/segments),this.audioInfo.dataArrayWave.length-1);
        var y = (this.audioInfo.dataArrayWave[index]/128)*WindowWidth/4;
        
        //draw segment
        if(x==0)
            this.waveform.lineTo(0,y);
        else
            this.waveform.lineTo(x/segments*WindowWidth,y);
    }

    this.waveform.endFill();

    var waveformTexture = app.renderer.generateTexture(this.waveform);
    this.waveformHistory.unshift(waveformTexture);
    var waveformTexturePrev = this.waveformHistory.pop();

    for(var x = 0; x < this.trailLength; x++)
    if(this.waveformHistory[x]){
        this.waveformHistoryTopSprites[x].texture = this.waveformHistory[x];
        this.waveformHistoryBottomSprites[x].texture = this.waveformHistory[x];
    }

    this.waveformSprite.texture = waveformTexture;
    if(waveformTexturePrev) waveformTexturePrev.destroy(true);  
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