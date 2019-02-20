VisualizerRollingHills = function(audioInfo){
    this.name = 'Rolling Hills v0';
    
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.trailLength = 100;
    this.waveformHistory = new Array(this.trailLength);
    this.waveformSprite = new Array(this.trailLength);

    this.movingSpriteTexture = new Array(3);
    this.movingSpriteTexture[0] = new PIXI.Texture.fromImage('images/flyingManL.png');
    this.movingSpriteTexture[1] = new PIXI.Texture.fromImage('images/flyingManC.png');
    this.movingSpriteTexture[2] = new PIXI.Texture.fromImage('images/flyingManR.png');

    //console.log(this.movingSpriteTexture);

    this.movingSprite = new PIXI.Sprite(this.movingSpriteTexture[1]);
    this.movingSpriteSpeed = 1;

    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
};

//create assets required when stage is created
VisualizerRollingHills.prototype.start = function(stage){
    //create waveform sprite
    this.stage = stage;
    app.renderer.backgroundColor = 0x880088;

    for(var x = 0; x<this.trailLength; x++){
        this.waveformSprite[x] = new PIXI.Sprite();
        this.waveformSprite[x].anchor.set(0.5,0);
        this.waveformSprite[x].x = WindowWidth/2;
        this.waveformSprite[x].y = WindowHeight/2;
        this.waveformSprite[x].scale.y = 1 + x*x/(this.trailLength*this.trailLength);

        if(x<10)
            this.waveformSprite[x].y += (10-x) * WindowWidth/3000 + (10-x)*(10-x)*WindowWidth/60000;
        else
            this.waveformSprite[x].y += (x-10) * WindowWidth/500 + (x-10)*(x-10)*WindowWidth/25000;

        this.waveformSprite[x].scale.x = 1 + x*x/(this.trailLength*this.trailLength);

        //add sprite to container
        stage.addChild(this.waveformSprite[x]);
    }   

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent(()=>{
        this.update();
    });

    this.updateHandlerBass = this.audioInfo.addEvent(0,()=>{
        this.update();
    });

    this.movingSprite.x = WindowWidth/2;
    this.movingSprite.y = WindowHeight/4;
    this.movingSprite.anchor.set(0.5,0.5);
    stage.addChild(this.movingSprite);

    this.addKeyHandlers();

    helpText.text = 'Fly through the hills of sound\n\n'
        + 'Press the Arrow keys to move';
}

//stop visualizer functions that dont stop when events are stopped
VisualizerRollingHills.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerRollingHills.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.audioInfo.removeEvent(0,this.updateHandlerBass);
    
    //destroy all assets
    this.waveformSprite.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.waveformHistory.forEach((e)=>e.destroy({children:true, texture:true, baseTexture:true}));
    this.movingSprite.destroy({children:true, texture:true, baseTexture:true});

    this.container.destroy({children:true, texture:true, baseTexture:true});

    this.removeKeyHandlers();
}

//resize all required elements when the window resizes
VisualizerRollingHills.prototype.resize = function(){

    //set the location after resize
    for(var x = 0; x<this.trailLength; x++){
        this.waveformSprite[x].x = WindowWidth/2;
        this.waveformSprite[x].y = WindowHeight/2;
        
        if(x<10)
            this.waveformSprite[x].y += (10-x)*(10-x)*WindowWidth/100000;
        else
            this.waveformSprite[x].y += (x-10) * WindowWidth/500 + (x-10)*(x-10)*WindowWidth/25000;
        
        this.waveformSprite[x].scale.y = 1 + x*x/(this.trailLength*this.trailLength);
        this.waveformSprite[x].scale.x = 1 + x*x/(this.trailLength*this.trailLength);
    }
}

//update the waveform information
VisualizerRollingHills.prototype.update = function(dt){

    //set num segments
    var segments = 200;
    
    // set a fill and line style
    this.waveform.clear();
    
    var fillColor = 0x000000;
    
    this.waveform.beginFill(fillColor);
    this.waveform.fillAlpha = 1;
    this.waveform.lineStyle(3, 0xFFFFFF, 1);
    
    // draw waveform
    this.waveform.moveTo(WindowWidth,WindowHeight);
    this.waveform.lineTo(0,WindowHeight);
    
    for(var x = 0; x <= segments; x++){
        var index = Math.min(Math.floor(x*this.audioInfo.dataArrayWave.length/segments),this.audioInfo.dataArrayWave.length-1);
        var y = (this.audioInfo.dataArrayWave[index]/128)*WindowWidth/4;
        
        //draw segment
        if(x==0)
            this.waveform.lineTo(0,y);
        else
            this.waveform.lineTo(x/segments*WindowWidth,y);
    }

    this.waveform.endFill();

    //handle history and texture creation
    var waveformTexture = app.renderer.generateTexture(this.waveform);
    this.waveformHistory.unshift(waveformTexture);
    var waveformTexturePrev = this.waveformHistory.pop()

    //move textures
    for(var x = 0; x < this.trailLength; x++)
        if(this.waveformHistory[x])
            this.waveformSprite[x].texture = this.waveformHistory[x];

    //destroy unused stuff
    if(waveformTexturePrev) waveformTexturePrev.destroy(true);    

    //move moving sprite(heh)
    this.updateSprite(dt);
}

VisualizerRollingHills.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        //console.log(ev);

        if(ev.key == 'ArrowUp')
            this.moveUp = true;

        if(ev.key == 'ArrowDown')
            this.moveDown = true;

        if(ev.key == 'ArrowLeft')
            this.moveLeft = true;

        if(ev.key == 'ArrowRight')
            this.moveRight = true;
    }.bind(this);

    this.keyHandlerUp = function(ev){
        //debug stuff
        ev = ev || window.event;
        //console.log(ev);

        
        if(ev.key == 'ArrowUp')
            this.moveUp = false;

        if(ev.key == 'ArrowDown')
            this.moveDown = false;

        if(ev.key == 'ArrowLeft')
            this.moveLeft = false;

        if(ev.key == 'ArrowRight')
            this.moveRight = false;
    }.bind(this);

    window.addEventListener("keydown", this.keyHandlerDown, false);
    window.addEventListener("keyup", this.keyHandlerUp, false);
}

VisualizerRollingHills.prototype.removeKeyHandlers = function(){
    this.keyHandler = window.removeEventListener("keydown",this.keyHandler, false);
    this.keyHandler = window.removeEventListener("keyup",this.keyHandler, false);    
}

VisualizerRollingHills.prototype.updateSprite = function(dt){
    if(this.moveUp)
        this.movingSprite.y -= this.movingSpriteSpeed * app.ticker.elapsedMS;

    if(this.moveDown)
        this.movingSprite.y += this.movingSpriteSpeed * app.ticker.elapsedMS;

    if(this.moveLeft)
        this.movingSprite.x -= this.movingSpriteSpeed * app.ticker.elapsedMS;

    if(this.moveRight)
        this.movingSprite.x += this.movingSpriteSpeed * app.ticker.elapsedMS;

    if(this.movingSprite.x < WindowWidth/3)
        this.movingSprite.texture = this.movingSpriteTexture[0];
    else if(this.movingSprite.x < 2*WindowWidth/3)
        this.movingSprite.texture = this.movingSpriteTexture[1];
    else
        this.movingSprite.texture = this.movingSpriteTexture[2];

    this.movingSprite.scale.x = 2 + 2.5*(this.movingSprite.y - WindowHeight/2)/WindowHeight;
    this.movingSprite.scale.y = 2 + 2.5*(this.movingSprite.y - WindowHeight/2)/WindowHeight;
}