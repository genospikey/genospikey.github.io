VisualizerFlowerGirl = function(audioInfo){
    this.name = 'Flower Girl Power';
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.waveformSprite = new PIXI.Sprite();
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
    this.grass = new Array(0);

    this.wind = {
        vx:[0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, ],
        vy:[0, 0, 0, 0, 0, 0, 0, 0]
    }

    this.windTimer = 0;
};

//create assets required when stage is created
VisualizerFlowerGirl.prototype.start = function(stage){
    
    app.renderer.backgroundColor = 0x000000;
    
    //create waveform sprite
    this.stage = stage;
  
    //add sprite to container
    stage.addChild(this.waveformSprite);

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    

    helpText.text = 'Flower Girl...';
    
    //create containers
    this.bgContainer = new PIXI.Container()
    this.pollenContainer = new PIXI.Container();
    this.flowerGirlContainer = new PIXI.Container();
    
    //create sprites
    this.flowerGirlSprite = new PIXI.Sprite.fromImage('images/flowerGirlSmall.png');
    this.flowerGirlSprite.x = WindowWidth/4;
    this.flowerGirlSprite.y = WindowHeight;
    this.flowerGirlSprite.width = WindowHeight/4;
    this.flowerGirlSprite.height = WindowHeight/2;
    this.flowerGirlSprite.anchor.set(0.0,1.0);
    this.flowerGirlContainer.addChild(this.flowerGirlSprite);
    this.drawGrass(this.flowerGirlContainer);

    //background 
    // this.bgTexture = new PIXI.Texture.fromImage('images/flowerbg.png');
    // this.bg = new PIXI.extras.TilingSprite(this.bgTexture, WindowWidth, WindowHeight);
    // this.bgContainer.addChild(this.bg);

    //create graphic and attach
    this.bgPainting = new PIXI.Graphics();
    this.bgPaintTimer = 1000;

    //add prev sprite
    this.bgSpritePrev = new PIXI.Sprite();
    this.bgSpritePrev.anchor.set(0.5,0.5);
    this.bgSpritePrev.x = WindowWidth/2;
    this.bgSpritePrev.y = WindowHeight/2;
    
    this.bgSpritePrev2 = new PIXI.Sprite();
    this.bgSpritePrev2.anchor.set(0.5,0.5);
    this.bgSpritePrev2.x = WindowWidth/2;
    this.bgSpritePrev2.y = WindowHeight/2;

    //add to container
    this.bgContainer.addChild(this.bgSpritePrev2);
    this.bgContainer.addChild(this.bgSpritePrev);
    this.bgContainer.addChild(this.bgPainting);

    //container
    this.stage.addChild(this.bgContainer);
    this.stage.addChild(this.pollenContainer);
    this.stage.addChild(this.flowerGirlContainer);
    
    this.pollenMovers = [];
    
    this.pollenTarget = new PollenTarget(
        Math.random()*(WindowWidth - 40) + 20, 
        Math.random()*(WindowHeight - 200) + 100, 
        this.pollenContainer, this);

    this.clickHandler = function(e){

        var hit = false;
        this.pollenMovers.forEach((element,s)=>{
            console.log(Math.hypot(element.sprite.x - e.clientX, element.sprite.y - e.clientY));
            if(Math.hypot(element.sprite.x - e.clientX, element.sprite.y - e.clientY)<30){
                hit = true;
                element.sprite.rotation += Math.PI/2;
                element.dir++;
                if(element.sprite.rotation >= Math.PI * 2){
                    this.pollenMovers.splice(s,1);
                    element.destroy();
                }
                console.log()
            }
        });

        if(!hit && e.clientY > 150)
            this.pollenMovers.push(new PollenMover(e.clientX, e.clientY, this.pollenContainer, this));
    }.bind(this);

    window.addEventListener("click", this.clickHandler, false);

    this.pollen = new Array(0);

    this.updateHandlerBass = this.audioInfo.addEvent(0,()=>{
        var x = WindowWidth * Math.random();
        var y = WindowHeight * Math.random();    
        
        for(var i = 0; i < 10; i++){
            this.paint(x, y);
        }

        this.pollen.forEach((e)=>{
            if(e.eq == 0)
                e.sprite.tint = 0xFFFFFF;
        });
    });

    this.updateHandlerBass2 = this.audioInfo.addEvent(1,()=>{
        this.pollen.forEach((e)=>{
            if(e.eq == 1)
                e.sprite.tint = 0xFFFFFF;
        });
    });

    this.updateHandlerBass3 = this.audioInfo.addEvent(2,()=>{
        this.pollen.forEach((e)=>{
            if(e.eq == 2)
                e.sprite.tint = 0xFFFFFF;
        });
    });
}

VisualizerFlowerGirl.prototype.movePollenMover = function(){
    var newPosition = this.data.getLocalPosition(this.parent);
    console.log(newPosition);
}

//stop visualizer functions that dont stop when events are stopped
VisualizerFlowerGirl.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerFlowerGirl.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);

    this.audioInfo.removeEvent(0, this.updateHandlerBass);
    this.audioInfo.removeEvent(1, this.updateHandlerBass2);
    this.audioInfo.removeEvent(2, this.updateHandlerBass3);
    
    //destroy all assets
    this.container.destroy({children:true, texture:true, baseTexture:true});
    this.bgContainer.destroy({children:true, texture:true, baseTexture:true});
    this.pollenContainer.destroy({children:true, texture:true, baseTexture:true});
    this.flowerGirlContainer.destroy({children:true, texture:true, baseTexture:true});

    window.removeEventListener("click",this.clickHandler, false);
}

//resize all required elements when the window resizes
VisualizerFlowerGirl.prototype.resize = function(){
    
}

//update the waveform information
VisualizerFlowerGirl.prototype.update = function(dt){

    //randomize wind
    this.windTimer -= dt;

    if(this.windTimer <= 0)
    {
        this.windTimer = 3;
        
        var vx = Math.min( Math.max(this.wind.vx[0] + Math.random() * .01 - .005, 0.1), 0.4);
        var vy = Math.min( Math.max(this.wind.vy[0] + Math.random() * .01 - .005, -0.05), 0.3);

        this.wind.vx.unshift(vx);
        this.wind.vy.unshift(vy);

        this.wind.vx.pop();
        this.wind.vy.pop();
    }

    this.grass.forEach((e)=>{
        e.update(dt, this.wind);
    });

    this.pollen.forEach((e,i)=>{
        e.update(dt, this.wind);
        if(e.destroyed){
            this.pollen.splice(i,1);
            e.destroy();
        }
    });

    this.pollenMovers.forEach((e,i)=>{
        e.update(dt);
    });

    if(Math.random() < 0.5){
        var x = this.flowerGirlSprite.x + this.flowerGirlSprite.width * 0.8 + Math.random() * 20;
        var y = this.flowerGirlSprite.y - this.flowerGirlSprite.height * 0.75 + Math.random() * 30;
        this.pollen.push(new Pollen(x, y, this.pollenContainer));
    }

    this.pollenTarget.update(dt);

    this.bgPaintTimer -= dt;
}

VisualizerFlowerGirl.prototype.drawGrass = function(stage){
    numGrass = WindowWidth/(WindowHeight/12)*8;
    for(x=0; x<numGrass; x++){
        s = new PIXI.Sprite.fromImage('images/grass.png');
        s.width = WindowHeight/12;
        s.height = WindowHeight/8 + WindowHeight/16 * Math.random();
        s.anchor.set(0.0, 1.0);
        s.y = WindowHeight;
        //s.x = 1.2 * WindowWidth * Math.random() - (WindowWidth * 0.1);
        s.x = (WindowWidth * -0.1) + 1.2 * WindowWidth * x/numGrass + Math.random() * WindowWidth * 0.05;
        
        s.update = function(dt, wind){
            var index = Math.min(Math.max(Math.floor(8 * this.x/WindowWidth),0),7);
            this.rotation = wind.vx[index];
        };

        stage.addChild(s);
        this.grass.push(s);
    }
}

VisualizerFlowerGirl.prototype.paint = function(xCenter, yCenter){

    if(xCenter&&yCenter){
        var x = xCenter + WindowWidth/4 * Math.random() - WindowWidth/8;
        var y = yCenter + WindowHeight/4 * Math.random() - WindowWidth/8;    
    }
    else{
        //get random location and size
        var x = WindowWidth * 1.2 * Math.random() - WindowWidth * .1;
        var y = WindowHeight * 1.2 * Math.random() - WindowHeight * .1;
    }

    var xVarScale = this.audioInfo.current[0]/255 * 40 + 40 * Math.random() + 10;
    var yVarScale = this.audioInfo.current[0]/255 * 40 + 40 * Math.random() + 10;

    var red = this.audioInfo.current[0]/255 * 64 + 64;
    var blue = this.audioInfo.current[0]/255 * 255 + 200;
    var green = this.audioInfo.current[0]/255 * 64 + 64;

    var fillColor = randomColor(red - 50, red, green - 50, green, 
        blue - 50, blue);

    for(var i = 0; i < this.audioInfo.current[0]/255 * 30; i++){

        var xVar = xVarScale * Math.random() - xVarScale/2;
        var yVar = yVarScale * Math.random() - yVarScale/2;
        var r = 20 * Math.random() + 2;

        this.bgPainting.beginFill(fillColor);
        this.bgPainting.drawRect(x + xVar,y + yVar,r,r);    
        this.bgPainting.endFill();
    }

    if(this.bgPaintTimer<=0){
        this.bgPaintTimer = 1000;
        var t = this.bgSpritePrev2.texture;
        this.bgSpritePrev2.texture = this.bgSpritePrev.texture;
        this.bgSpritePrev.texture = app.renderer.generateTexture(
            this.bgPainting,
            PIXI.SCALE_MODES.NEAREST,
            1,
            new PIXI.Rectangle(0,0,WindowWidth,WindowHeight)
        );
        
        t.destroy();
        
        this.bgPainting.clear();
    }

    //generate prev sprite
    //let renderer = PIXI.autoDetectRenderer(1024, 1024);
    //renderer.render(this.bgPainting, this.bgSpritePrev);
}


Pollen = function(x, y, stage){
    
    this.sprite = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    
    this.vx = Math.random() * 0.2 + 0.2;
    this.vy = Math.random() * 0.2 - 0.1;
    this.ax = 0;
    this.ay = 0;

    this.sprite.width = 5;
    this.sprite.height = 5;
    this.sprite.tint = randomColor(122,233,105,233,98,230);
    this.baseColor = this.sprite.tint;
    this.sprite.anchor.set(0.5,0.5);
    this.sprite.x = x;
    this.sprite.y = y;

    this.eq = Math.floor(Math.random() * 10);

    this.destroyed = false;
    
    this.stage = stage;
    this.stage.addChild(this.sprite);
}

Pollen.prototype.update = function(dt, wind){
    var index = Math.min(Math.max(Math.floor(8 * this.sprite.x/WindowWidth),0),7);
 
    this.sprite.x += wind.vx[index] * dt + this.vx * dt;
    this.sprite.y += wind.vy[index] * dt + this.vy * dt;

    var currentR = (this.sprite.tint >> 16) & 255;
    var currentG = (this.sprite.tint >> 8) & 255;
    var currentB = (this.sprite.tint) & 255;

    var targetR = (this.baseColor >> 16) & 255;
    var targetG = (this.baseColor >> 8) & 255;
    var targetB = (this.baseColor) & 255;

    for(var i = 0; i < 3; i++){
        if(currentR < targetR) currentR += 1;
        if(currentR > targetR) currentR -= 1;
        if(currentB < targetB) currentB += 1;
        if(currentB > targetB) currentB -= 1;
        if(currentG < targetG) currentG += 1;
        if(currentG > targetG) currentG -= 1;        
    }

    this.sprite.tint = (currentR << 16) + (currentG << 8) + currentB;

    if(this.sprite.x >= WindowWidth + 10 || this.sprite.x <= -10 || this.sprite.y <= -10 ||
        this.sprite.y >= WindowHeight + 10)
        this.destroyed = true;
}

Pollen.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}

function randomColor(minR,maxR,minG,maxG,minB,maxB){
    var color = (Math.floor(Math.random()*(maxR-minR)+minR) << 16) + (Math.floor(Math.random()*(maxG-minG)+minG) << 8) + Math.floor(Math.random()*(maxB-minB)+minB);
    return color;
}

PollenMover = function(x, y, stage, base){
    this.stage = stage;
    this.base = base;
    this.dir = 0;

    var frames = [];
    frames.push(new PIXI.Texture.fromImage('images/warp1.png'));
    frames.push(new PIXI.Texture.fromImage('images/warp2.png'));
    frames.push(new PIXI.Texture.fromImage('images/warp3.png'));
    frames.push(new PIXI.Texture.fromImage('images/warp4.png'));

    this.sprite = new PIXI.extras.AnimatedSprite(frames);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);
    this.sprite.animationSpeed = .1;
    this.sprite.play();

    this.sprite2 = new PIXI.Sprite.fromImage('images/warpCircle.png');
    this.sprite2.x = x;
    this.sprite2.y = y;
    this.sprite2.anchor.set(0.5,0.5);
    this.sprite2.width = 100;
    this.sprite2.height = 100;

    this.stage.addChild(this.sprite);
    this.stage.addChild(this.sprite2);
}

PollenMover.prototype.update = function(dt){
    
    this.base.pollen.forEach((e,i)=>{
        if(Math.hypot(e.sprite.x - this.sprite.x, e.sprite.y - this.sprite.y)<50){
            switch(this.dir){ 
                case 0: e.vy -= .3 * dt; break;
                case 1: e.vx += .3 * dt; break;
                case 2: e.vy += .3 * dt; break;
                case 3: e.vx -= .3 * dt; break;
                default: break;
            }
        }
    });
}

PollenMover.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.stage.removeChild(this.sprite2);
    this.sprite.destroy();
    this.sprite2.destroy();
}

PollenTarget = function(x, y, stage, base){
    this.stage = stage;
    this.base = base;

    this.sprite = new PIXI.Sprite.fromImage('images/pollenTarget.png')
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);

    this.sprite2 = new PIXI.Sprite.fromImage('images/ptcircle.png');
    this.sprite2.x = x;
    this.sprite2.y = y;
    this.sprite2.anchor.set(0.5,0.5);
    this.sprite2.width = 100;
    this.sprite2.height = 100;
    this.sprite2.alpha = .3;

    this.hits = 0;

    this.stage.addChild(this.sprite);
    this.stage.addChild(this.sprite2);
}

PollenTarget.prototype.update = function(dt){
    
    this.base.pollen.forEach((e,i)=>{
        if(Math.hypot(e.sprite.x - this.sprite.x, e.sprite.y - this.sprite.y)<50){
            e.destroyed = true;
            this.hits++;
        }
    });

    this.sprite2.alpha = .3 + .7 * (this.hits/1000);

    if(this.hits > 1000){
        this.sprite.x = Math.random()*(WindowWidth - 40) + 20;
        this.sprite.y = Math.random()*(WindowHeight - 200) + 100;
        this.sprite2.x = this.sprite.x;
        this.sprite2.y = this.sprite.y;
        this.hits = 0;
    }
}

PollenTarget.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.stage.removeChild(this.sprite2);
    this.sprite.destroy();
    this.sprite2.destroy();
}