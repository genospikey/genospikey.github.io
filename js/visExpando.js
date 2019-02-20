VisualizerExpando = function(audioInfo){
    this.name = 'Presto Expando';

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

    this.expand = false;
    this.expandTimer = 0;
};

//create assets required when stage is created
VisualizerExpando.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;
    console.log(this.stage);
    this.waveformSprite.anchor.set(0.5,0.5);
    this.waveformSprite.x = WindowWidth/2;
    this.waveformSprite.y = WindowHeight/2;
    this.waveformSprite.scale.y = 1;
    this.waveformSprite.scale.x = 1;
    this.waveformSprite.zOrder = 10;
    this.waveformSprite.parentGroup = visGroup;

    //add sprite to container
    stage.addChild(this.waveformSprite);

    for(var x = 0; x<this.trailLength; x++){
        //top srpites
        this.waveformHistoryTopSprites[x] = new PIXI.Sprite();
        this.waveformHistoryTopSprites[x].anchor.set(0.5,0);
        this.waveformHistoryTopSprites[x].x = WindowWidth/2;
        this.waveformHistoryTopSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryTopSprites[x].y -= x * WindowWidth/500;

        //flip y
        this.waveformHistoryTopSprites[x].scale.y = -(1 + 3*x/this.trailLength);
        this.waveformHistoryTopSprites[x].scale.x = 1 + 3*x/this.trailLength;

        this.waveformHistoryTopSprites[x].parentGroup = visGroup;
        
        if(x<this.trailLength/2)
            this.waveformHistoryTopSprites[x].alpha = 1 * x/this.trailLength;
        else
            this.waveformHistoryTopSprites[x].alpha = 1 * (this.trailLength - x)/this.trailLength;

        //bottom sprites
        this.waveformHistoryBottomSprites[x] = new PIXI.Sprite();
        this.waveformHistoryBottomSprites[x].anchor.set(0.5,0);
        this.waveformHistoryBottomSprites[x].x = WindowWidth/2;
        this.waveformHistoryBottomSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryBottomSprites[x].y += x * WindowWidth/500;

        //scale
        this.waveformHistoryBottomSprites[x].scale.y = 1 + 3*x/this.trailLength;
        this.waveformHistoryBottomSprites[x].scale.x = 1 + 3*x/this.trailLength;

        this.waveformHistoryBottomSprites[x].parentGroup = visGroup;
        
        if(x<this.trailLength/2)
            this.waveformHistoryBottomSprites[x].alpha = 1 * x/this.trailLength;
        else
            this.waveformHistoryBottomSprites[x].alpha = 1 * (this.trailLength - x)/this.trailLength;

        //add sprite to container
        stage.addChild(this.waveformHistoryTopSprites[x]);
        stage.addChild(this.waveformHistoryBottomSprites[x]);

        helpText.text = 'Enjoy the ever expanding\nuniverse';
    } 

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    this.expandHandler = this.audioInfo.addEvent(0,()=>{
        this.expandTimer += 5;
    });

    this.expandHandler2 = this.audioInfo.addEvent(1,()=>{
        this.expandTimer += 5;
    });
}

//stop visualizer functions that dont stop when events are stopped
VisualizerExpando.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerExpando.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.audioInfo.removeEvent(0,this.expandHandler);
    this.audioInfo.removeEvent(1,this.expandHandler2);
    
    //destroy all assets
    this.waveformSprite.destroy({children:true, texture:true, baseTexture:true});
    this.waveformHistoryTopSprites.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.waveformHistoryBottomSprites.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.waveformHistory.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.container.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisualizerExpando.prototype.resize = function(){
    
    //set location of waveform sprite
    if(this.waveformSprite){
        this.waveformSprite.x = WindowWidth/2;
        this.waveformSprite.y = WindowHeight/2;
    }

    for(var x = 0; x<this.trailLength; x++){
        //top srpites
        this.waveformHistoryTopSprites[x].x = WindowWidth/2;
        this.waveformHistoryTopSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryTopSprites[x].y -= x * WindowWidth/500;

        //bottom sprites
        this.waveformHistoryBottomSprites[x].x = WindowWidth/2;
        this.waveformHistoryBottomSprites[x].y = WindowHeight/2;

        // y offset
        this.waveformHistoryBottomSprites[x].y += x * WindowWidth/500;
    } 
}

//update the waveform information
VisualizerExpando.prototype.update = function(dt){

    this.expandTimer = Math.max(this.expandTimer-dt,0);

    //colorshifting
    this.colorShift.step();
    
    //set num segments
    var segments = 200;
    
    // set a fill and line style
    this.waveform.clear();
    this.waveform.beginFill(this.colorShift.current);
    this.waveform.fillAlpha = 0;
    this.waveform.lineStyle(3, this.colorShift.current, 1);

    // draw waveform
    for(x = 0; x < segments; x++){
        var index = Math.min(Math.floor(x*this.audioInfo.dataArrayWave.length/segments),this.audioInfo.dataArrayWave.length-1);
        var y = (this.audioInfo.dataArrayWave[index]/128)*WindowHeight/2;
        
        //draw segment
        if(x==0)
            this.waveform.moveTo(0,y);
        else
            this.waveform.lineTo(x/segments*WindowWidth,y);
    }

    this.waveform.endFill();

    var waveformTexturePrev = this.waveformSprite.texture;
    var waveformTexture = app.renderer.generateTexture(this.waveform);

    if(this.expandTimer>0){
        //clear expand variable
        this.expand = false;

        this.waveformHistory.unshift(waveformTexture);
        var waveformHistoryPrev = this.waveformHistory.pop();

        for(var x = 0; x < this.trailLength; x++)
            if(this.waveformHistory[x]){
                this.waveformHistoryTopSprites[x].texture = this.waveformHistory[x];
                this.waveformHistoryBottomSprites[x].texture = this.waveformHistory[x];

                if(x<this.trailLength/2)
                    this.waveformHistoryTopSprites[x].alpha = 1 * x/this.trailLength;
                else
                    this.waveformHistoryTopSprites[x].alpha = 1 * (this.trailLength - x)/this.trailLength;

                if(x<this.trailLength/2)
                    this.waveformHistoryBottomSprites[x].alpha = 1 * x/this.trailLength;
                else
                    this.waveformHistoryBottomSprites[x].alpha = 1 * (this.trailLength - x)/this.trailLength;
            }
        
        if(waveformHistoryPrev) waveformHistoryPrev.destroy(true);
    }
    else{
        //lower alpha for all till 0
        for(var x = 0; x < this.trailLength; x++)
            if(this.waveformHistory[x]){
                this.waveformHistoryTopSprites[x].alpha = Math.max(this.waveformHistoryTopSprites[x].alpha - dt * 0.01,0);
                this.waveformHistoryBottomSprites[x].alpha = Math.max(this.waveformHistoryBottomSprites[x].alpha - dt * 0.01,0);
            }
    }

    var inHistory = this.waveformHistory.find((e)=>{
        return waveformTexturePrev === e;
    });

    this.waveformSprite.texture = waveformTexture;
    if(waveformTexturePrev && !(inHistory)) waveformTexturePrev.destroy(true); 
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