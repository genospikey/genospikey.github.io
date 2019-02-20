VisualizerXmas = function(audioInfo){
    this.name = 'Christmas Time! Christmas Time! ';

    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.waveformSprite = new PIXI.Sprite();
    this.treeSprite = new PIXI.Sprite.fromImage('/images/tree.png');
    this.snowTexture = new PIXI.Texture.fromImage('/images/snow.png');
    this.bg = new PIXI.Sprite.fromImage('/images/xmasbg.png');
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
    this.colorShift = new ColorShift();
    this.snow = new Array(0);
    this.snowSpawn = 0;
    this.wind = {
        vx:0,
        vy:0
    }
};

//create assets required when stage is created
VisualizerXmas.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    
    this.bg.anchor.set(0.5,0.5);
    this.bg.width = WindowWidth;
    this.bg.height = WindowHeight;
    this.bg.x = WindowWidth/2;
    this.bg.y = WindowHeight/2;
    stage.addChild(this.bg);
    
    //create waveform sprite
    this.stage = stage;
    this.waveformSprite.anchor.set(0.5,0.5);
    this.waveformSprite.x = WindowWidth/2;
    this.waveformSprite.y = WindowHeight/2;
    this.waveformSprite.scale.y = 1;
    this.waveformSprite.scale.x = 1;

    //add sprite to container
    stage.addChild(this.waveformSprite);

    console.log(this.bg);
    this.treeSprite.anchor.set(0.5,0.5);
    this.treeSprite.x = WindowWidth/2;
    this.treeSprite.y = 9*WindowHeight/16;
    this.treeSprite.height = WindowHeight/1.1;
    this.treeSprite.width = this.treeSprite.height*0.8;
    stage.addChild(this.treeSprite);

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    this.expandHandler = this.audioInfo.addEvent(0,()=>{
        this.snowSpawn = Math.min(this.snowSpawn + 1, 100);
            //colorshifting
        this.colorShift.step();
    });

    this.expandHandler2 = this.audioInfo.addEvent(1,()=>{
        this.snowSpawn = Math.min(this.snowSpawn + 1, 100);
            //colorshifting
        this.colorShift.step();
    });

    helpText.text = 'Chillin\' in a winter wonderland';
}

//stop visualizer functions that dont stop when events are stopped
VisualizerXmas.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerXmas.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.audioInfo.removeEvent(0,this.expandHandler);
    this.audioInfo.removeEvent(1,this.expandHandler2);
    
    //destroy all assets
    this.stage.removeChild(this.waveformSprite);
    this.waveformSprite.destroy({children:true, texture:true, baseTexture:true});
    
    this.stage.removeChild(this.treeSprite);
    this.treeSprite.destroy({children:true, texture:true, baseTexture:true});
    this.bg.destroy({children:true, texture:true, baseTexture:true});
    
    console.log('Destroy Xmas');
    this.snow.forEach((e)=>{
        e.destroy();
    });
    this.snowTexture.destroy();
    
    this.container.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisualizerXmas.prototype.resize = function(){
    
    //set location of waveform sprite
    if(this.waveformSprite){
        this.waveformSprite.x = WindowWidth/2;
        this.waveformSprite.y = WindowHeight/2;
    }

    if(this.treeSprite){
        this.treeSprite.x = WindowWidth/2;
        this.treeSprite.y = 9*WindowHeight/16;
        this.treeSprite.height = WindowHeight/1.1;
        this.treeSprite.width = this.treeSprite.height*0.8;
    }

    if(this.bg){
        this.bg.width = WindowWidth;
        this.bg.height = WindowHeight;
        this.bg.x = WindowWidth/2;
        this.bg.y = WindowHeight/2;
    }
}

//update the waveform information
VisualizerXmas.prototype.update = function(dt){

    //randomize wind
    if(Math.random()<.001){
        this.wind.vx = Math.min( Math.max(this.wind.vx + Math.random() * .05 + .025, -0.5), 0.5);
        this.wind.vy = Math.min( Math.max(this.wind.vy + Math.random() * .05 + .025, -0.1), 0.1);
    }

    //spawn snow
    for(var x = 0; x<this.snowSpawn; x++){
        var newSnow = new Snow(this.snowTexture, Math.random()*2*WindowWidth-WindowWidth/2, 0,
                this.stage, this.colorShift.current);
        this.snow.push(newSnow);
    }

    this.snowSpawn = 0;
    
    //update snow
    this.snow.forEach((e,i)=>{
        e.update(dt, e.sprite.tint, this.wind);
        if(e.state == 'destroy'){
            e.destroy();
            this.snow.splice(i,1);
        }
    });
  
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

Snow = function(texture,x,y,stage,tint){
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);
    if(tint)this.sprite.tint = tint;
    this.sprite.scale.x = .5 + Math.random();
    this.sprite.scale.y = this.sprite.scale.x;
    this.stage = stage;
    this.state = 'falling';
    this.sprite.vy = 1;
    this.sprite.vrotate = Math.random()*.01 - .005;
    stage.addChild(this.sprite);    
}

Snow.prototype.update = function(dt,tint,wind){
    
    this.sprite.tint = tint;

    //falling
    if(this.state == 'falling'){
        this.sprite.y += dt * this.sprite.scale.x * this.sprite.vy;
        this.sprite.x += dt * this.sprite.scale.x * wind.vx;
        this.sprite.y += dt * this.sprite.scale.x * wind.vy;
        this.sprite.rotation += dt * this.sprite.vrotate;
        
        if(this.sprite.y>(WindowHeight*1.025 - WindowHeight / (13 * this.sprite.scale.x)))
            this.state = 'melt';
    }

    //melting
    if(this.state == 'melt'){
        //console.log('im melting!');
        this.sprite.scale.x = this.sprite.scale.x * .999;
        this.sprite.scale.y = this.sprite.scale.x;

        if(this.sprite.scale.x <= .1){
            this.state = 'destroy';
        }
    }
}

Snow.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}