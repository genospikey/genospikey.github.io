VisualizerPlatformer = function(audioInfo){
    this.name = 'Bouncy Ball';

    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.waveform = new PIXI.Graphics();
    this.waveformSprite = new PIXI.Sprite();
    this.container = new PIXI.Container();
    this.messageText = new PIXI.Text();
    this.scoreText = new PIXI.Text();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;

    this.blocks = new Array(0);
    this.blockRows = 5;
    this.blockTimer = new Array(5);
    for(var x = 0; x<this.blockTimer.length; x++){
        this.blockTimer[x] = 0;
    }

};

//create assets required when stage is created
VisualizerPlatformer.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;
    this.waveformSprite.anchor.set(0.5,0.5);
    this.waveformSprite.x = WindowWidth/2;
    this.waveformSprite.y = WindowHeight/4;
    this.waveformSprite.scale.y = 1;
    this.waveformSprite.scale.x = 1;
    this.waveformColor = 0xFFFFFF;

    //add sprite to container
    //stage.addChild(this.waveformSprite);

    //ADD STARS
    this.bg = new PIXI.Sprite(makeBG());
    this.stage.addChild(this.bg);

    //add pbg
    this.pbg = new ParallaxBG(
            [new PIXI.Texture.fromImage('images/hill1.png'),
             new PIXI.Texture.fromImage('images/hill2.png')], 
            15, 0xFF88CC, 0x111555, this.stage);

    //spawn blocks
    this.blockSpawnHandlers = [];
    for(var x = 0; x<this.blockRows; x++){
        var index = Math.round(audioInfo.numSlices/this.blockRows * x);
        var freqIndex = Math.round(audioInfo.dataArrayFreq.length/this.blockRows*x);
        console.log('Adding function with index:' + index + ' and freq index: ' + freqIndex);
        
        var callback = function(x,freqIndex){
            if(this.blockTimer[x]==0){
                var blockSize = WindowHeight*0.05;
                var vx = -1*WindowWidth/120;
                var timer = Math.abs(blockSize/vx);
                //var timer = 10;
                this.blockTimer[x] = timer;
                this.blocks.push(new PlatformSquare(WindowWidth*1.1, WindowHeight*0.8 - x*blockSize*2, 
                        blockSize, blockSize, vx, 0, this.stage));
            }
        }
        
        var h = this.audioInfo.addEvent(index,callback.bind(this,x,freqIndex));
        this.blockSpawnHandlers.push({
            index: index,
            handler: h
        });
    }

    //add color change handler for bass notes
    this.colorChangeHandler = this.audioInfo.addEvent(0,()=>{
        this.waveformColor = Math.floor(Math.random() * 0xFFFFFF);
    });

    //add the character!
    this.player = new RunningMan(WindowWidth-100,100, 
            WindowHeight*0.025, WindowHeight*0.025, this.stage);


    //add message text and function for updating
    this.messageText.style = {
        fill: '#4C4D1E',
        font: '30px',
        fontFamily: 'VT323, monospace'
    };

    this.messageText.textTimer = 0;
    this.messageText.anchor.set(0.5,0.5);
    this.messageText.x = WindowWidth/2
    this.messageText.y = WindowHeight - 50;

    this.messageText.setMessage = function(text,t){
        this.textTimer = t;
        this.text = text;
    }

    this.messageText.update = function(dt){
        this.textTimer -= dt;
        if(this.textTimer <= 0){
            this.textTimer = 0;
            this.text = '';
        }
    }

    this.scoreText.style = {
        fill: '#4C4D1E',
        font: '30px',
        fontFamily: 'VT323, monospace'
    };

    this.scoreText.textTimer = 0;
    this.scoreText.anchor.set(1,0.5);
    this.scoreText.x = WindowWidth - 50;
    this.scoreText.y = WindowHeight - 50;

    this.scoreText.update = function(score){
        this.text = 'Score: ' + score;
    }

    this.stage.addChild(this.messageText);
    this.stage.addChild(this.scoreText);

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    helpText.text = 'Keep on rollin\'!\n\n'
                  + 'Press arrow keys to move or\n'
                  + 'simply observe';
}

//stop visualizer functions that dont stop when events are stopped
VisualizerPlatformer.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerPlatformer.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.audioInfo.removeEvent(0,this.colorChangeHandler);
    this.blockSpawnHandlers.forEach((e)=>{
        this.audioInfo.removeEvent(e.index,e.handler);
    });

    //destroy all assets
    this.waveformSprite.destroy({children:true, texture:true, baseTexture:true});
    this.player.destroy();
    this.blocks.forEach((e)=>{e.destroy();});
    this.pbg.destroy();
    
    this.container.destroy({children:true, texture:true, baseTexture:true});

    this.bg.destroy(true);
    
    this.scoreText.destroy();
    this.messageText.destroy();
}

//resize all required elements when the window resizes
VisualizerPlatformer.prototype.resize = function(){
    
    //set location of waveform sprite
    if(this.waveformSprite){
        this.waveformSprite.x = WindowWidth/2;
        this.waveformSprite.y = WindowHeight/4;
    }

    this.player.resize(WindowWidth-100,100);

    this.messageText.x = WindowWidth/2;
    this.messageText.y = WindowHeight - 50;

    this.scoreText.x = WindowWidth -  50;
    this.scoreText.y = WindowHeight - 50;

    var oldBG = this.bg.texture;
    this.bg.texture = makeBG();
    oldBG.destroy();

    this.pbg.resize();
}

//update the waveform information
VisualizerPlatformer.prototype.update = function(dt){
    

    //increment block timers
    for(var x = 0; x<this.blockTimer.length; x++){
        this.blockTimer[x] = Math.max(this.blockTimer[x] - dt,0);
    }

    //update block locations
    this.blocks.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed){
            this.blocks.splice(i,1);
        }
    });

    //update running man
    var s = this.player.update(dt,this.blocks.map((e)=>e.sprite));
    if(s=='dead')
        this.messageText.setMessage('---UR DED---',200);

    //update text
    this.messageText.update(dt);

    //update score
    this.scoreText.update(this.player.score);

    //update the paralox bg
    this.pbg.update(dt);

    //set num segments
    // var segments = 200;
    
    // // set a fill and line style
    // this.waveform.clear();
    // this.waveform.fillAlpha = 0;
    // this.waveform.lineStyle(5, this.waveformColor, 1);
    
    // // draw waveform
    // for(x = 0; x < segments; x++){
    //     var index = Math.min(Math.floor(x*this.audioInfo.dataArrayWave.length/segments),this.audioInfo.dataArrayWave.length-1);
    //     var y = (this.audioInfo.dataArrayWave[index]/128)*WindowWidth/4;
        
    //     //draw segment
    //     if(x==0)
    //         this.waveform.moveTo(0,y);
    //     else
    //         this.waveform.lineTo(x/segments*WindowWidth,y);
    // }

    // this.waveform.endFill();
    // var waveformTexture = app.renderer.generateTexture(this.waveform);
    // var waveformTexturePrev = this.waveformSprite.texture;
    // this.waveformSprite.texture = waveformTexture;
    // waveformTexturePrev.destroy(true);    
}

function makeBG(){
    var g = new PIXI.Graphics();
    
    g.lineStyle(1, 0xFFFFFF, 0);
    g.fillAlpha = 1;

    for(var x = 0; x<500+Math.random()*500;x++){

        var rC = Math.round(128 + 128 * Math.random());
        var gC = Math.round(128 + 128 * Math.random());
        var bC = Math.round(128 + 128 * Math.random());
        
        var color = (rC << 16) + (gC << 8) + bC;

        g.beginFill(color);
        g.drawStar(
                WindowWidth * Math.random(), 
                WindowHeight * Math.random(), 
                4,Math.ceil(Math.random()*2));
    }

    var texture = app.renderer.generateTexture(g);
    return texture;
}


//moving platforms for jumping on
PlatformSquare = function(x, y, width, height, vx, vy,stage){
    //create square
    this.sprite = PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.vx = vx;
    this.sprite.vy = vy;
    this.sprite.scale.x = 1;
    this.sprite.scale.y = 1;
    this.sprite.width = width;
    this.sprite.height = height;
    this.sprite.tint = Math.random() * 0xFFFFFF;
    this.sprite.hit = false;
    this.stage = stage;

    //create spawn effect
    this.spawnEffect = PIXI.Sprite.fromImage('images/squarespawn.png');
    this.spawnEffect.anchor.set(1, 0.5);
    this.spawnEffect.x = WindowWidth;
    this.spawnEffect.y = y;
    this.spawnEffect.scale.x = 1;
    this.spawnEffect.scale.y = 1;
    this.spawnEffect.width = width * .1;
    this.spawnEffect.height = height * 1.1;
    this.spawnEffect.alpha = 1;
    this.spawnEffect.timer = 20;
    
    stage.addChild(this.sprite);
    stage.addChild(this.spawnEffect);
    this.destroyed = false;
}

PlatformSquare.prototype.update = function (dt){
    this.sprite.x += dt * this.sprite.vx;
    this.sprite.y += dt * this.sprite.vy;

    if(this.sprite.x<(-0.5*WindowWidth)||this.sprite.x>(1.5*WindowWidth)||
            this.sprite.y<(-0.5*WindowHeight)||this.sprite.y>(1.5*WindowHeight)){
        this.destroy();
    }

    this.spawnEffect.timer -= dt;
    if(this.spawnEffect.timer>15){
        this.spawnEffect.alpha = Math.min(this.spawnEffect.alpha + dt * .2,1);
        this.spawnEffect.width += dt * this.sprite.width/2.5;
    }
    else{
        this.spawnEffect.alpha = Math.max(this.spawnEffect.alpha - dt * .1,0);
    }
}

PlatformSquare.prototype.destroy = function (){
    this.destroyed = true;
    this.stage.removeChild(this.sprite);
    this.stage.removeChild(this.spawnEffect);
    this.sprite.destroy();
    this.spawnEffect.destroy();
}

//Runningman - interactive character for visualizer
RunningMan = function(x,y,width,height,stage){
    this.state = 'idle';
    this.score = 0;

    //sprite info
    this.startX = x;
    this.startY = y;
    this.sprite = PIXI.Sprite.fromImage('images/whiteCircle.png');
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.platformVX = 0;
    this.sprite.platformVY = 0;
    this.sprite.scale.x = 1;
    this.sprite.scale.y = 1;
    this.sprite.ax = 0;
    this.sprite.ay = .1;
    this.sprite.width = width;
    this.sprite.height = height;
    this.moveSpeed = WindowWidth/3000;

    this.autoMove = true;
    
    this.stage = stage;

    this.deathParticle = [];

    this.addKeyHandlers();

    stage.addChild(this.sprite);
    this.destroyed = false;
}

RunningMan.prototype.update = function(dt,colliders){
    //if dead - reset
    if(this.state == 'dead'){
        this.deathParticle.push(new DeathParticle(this.sprite.x,this.sprite.y,this.stage));
        this.score = 0;
        this.sprite.x = this.startX;
        this.sprite.y = this.startY;
        this.sprite.vx = 0;
        this.sprite.vy = 0;
        this.sprite.platformVX = 0;
        this.sprite.platformVY = 0;
        this.state = 'idle';
        this.autoMove = true;
        this.onGround = false;
    }

    //if idle, move when you get an input
    if(this.state == 'idle'){
        this.state = 'playing';
    }

    //if below threshold - be dead
    if(this.state == 'playing'){

        if(this.autoMove){
            if(this.sprite.x < WindowWidth/3) 
                this.moveRight = true;
            else if(this.sprite.vx < -5.0)
                this.moveRight = true;
            else
                this.moveRight = false;

            if(this.sprite.x > 2*WindowWidth/3) 
                this.moveLeft = true;
            else if(this.sprite.vx > 5.0)
                this.moveLeft = true;
            else 
                this.moveLeft = false;
        }

        var col = false;
        var damperVY = false;
        var damperVX = false;
        this.onGround = false;
        //check for collisions
        b.hit(
            this.sprite,
            colliders,
            true, false, false,

            //handle collision
            function(c,s){
                col = true;
                //console.log(this,c,s);
                switch(c){
                    case 'left':
                        this.sprite.platformVX = s.vx;
                        if(!damperVX){
                            this.sprite.vx = s.vx - (this.sprite.vx - s.vx) * 1;
                            damperVX = true;
                        }
                        break;
                    case 'right':
                        this.sprite.platformVX = s.vx;
                        if(!damperVX){
                            this.sprite.vx = s.vx - (this.sprite.vx - s.vx) * 1;
                            damperVX = true;
                        }
                        break;
                    case 'top':
                        if(!damperVY){
                            this.sprite.vy = s.vy - (this.sprite.vy - s.vy) * 1;
                            damperVY = true;
                        }
                        break;
                    case 'bottom':
                        this.onGround = true;

                        if(!damperVY){
                            this.sprite.vy = s.vy - (this.sprite.vy - s.vy) * 1;
                            damperVY = true;
                        }

                        this.sprite.platformVX = s.vx;
                        break;
                    default: break;
                }

                if(s.hit == false){
                    s.hit = true;
                    s.tint = 0xFFFFFF;
                    this.score++;
                }
            }.bind(this)
        );

        
        //if colliding with platform add x velocity
        if(col){
            this.sprite.vx += (this.sprite.platformVX - this.sprite.vx) * .05;
        }

        //console.log(col,this.sprite.platformVX,this.sprite.vx);
        var mVX = 0;
        if(this.moveLeft) mVX -= this.moveSpeed;
        if(this.moveRight) mVX += this.moveSpeed;


        //update velocity and location
        this.sprite.vx += this.sprite.ax * dt + mVX * dt;
        this.sprite.vy += this.sprite.ay * dt;

        // if(this.onGround){
        //     this.sprite.vy = 0;
        // }

        this.sprite.x  += this.sprite.vx * dt;
        this.sprite.y  += this.sprite.vy * dt;


        if(this.sprite.y > WindowHeight * 1.1){
            this.state = 'dead';
        }
    }

    this.deathParticle.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
            this.deathParticle.splice(i,1);
    });

    return this.state;
}

RunningMan.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.removeKeyHandlers();
    this.sprite.destroy(true);
    this.deathParticle.forEach((e)=>{e.destroy()});
}

RunningMan.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        console.log(ev);

        if(ev.key == 'ArrowUp'){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveUp = true;
        }

        if(ev.key == 'ArrowDown'){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveDown = true;
        }

        if(ev.key == 'ArrowLeft'){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveLeft = true;
        }

        if(ev.key == 'ArrowRight'){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveRight = true;
        }
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

RunningMan.prototype.removeKeyHandlers = function(){
    this.keyHandler = window.removeEventListener("keydown",this.keyHandler, false);
    this.keyHandler = window.removeEventListener("keyup",this.keyHandler, false);    
}

RunningMan.prototype.resize = function(x,y){
    this.startX = x;
    this.startY = y;  
}

//do initial setup
//ParallaxBG - setup parallax scrolling bg
ParallaxBG = function(tex, numLayers, baseColor, targetColor, stage){
    this.textures = tex;
    this.numLayers = numLayers;
    this.baseColor = baseColor;
    this.targetColor = targetColor;
    this.stage = stage;
    this.speed = -0.1;

    
    //generate layers
    this.layers = new Array(this.numLayers);
    this.sprites = new Array(this.numLayers);

    for(var i = 0; i<this.numLayers; i++){
        
        var x = Math.random() * -1 * WindowWidth/2;
        var j = 0;
        var sprites = [];
        this.layers[i] = new PIXI.Container();
        

        //make stuff till the end
        while(x<WindowWidth){
            var width = (Math.ceil(Math.random()*4)+2)/12*WindowWidth;
            var height = WindowHeight/8 + i/this.numLayers*WindowHeight/4-(i*i)/(this.numLayers*this.numLayers)*WindowHeight/8;
            sprites[j] = new PIXI.Sprite(this.randomTexture());
            
            sprites[j].anchor.set(0,1);
            sprites[j].x = x;
            sprites[j].y = WindowHeight;
            sprites[j].scale.x = 1;
            sprites[j].scale.y = 1;
            sprites[j].width = width;
            sprites[j].height = height;
            sprites[j].tint = this.getColorGradient(baseColor, targetColor, numLayers, i);

            //add to screen
            this.layers[i].addChild(sprites[j]);
            
            //increment values
            x += sprites[j].width;
            j++;
        }

        console.log(sprites);
        this.sprites[i] = sprites;
        console.log(this.sprites[this.sprites.length-1]);
    }

    for(var i = this.layers.length - 1; i >= 0; i--){
        this.stage.addChild(this.layers[i]);
    }
}

ParallaxBG.prototype.update = function(dt){
    if(this.speed != 0){
        
        //move each layer an add and remove as necessary
        for(var i = 0; i<this.numLayers; i++){

            //figure out move distance
            var moveX = (this.speed + this.speed*(this.numLayers - i)*(this.numLayers - i)/this.numLayers) * dt;
            
            for(var j = 0; j < this.sprites[i].length; j++){
                this.sprites[i][j].x += moveX;
            }

            if(this.sprites[i][0].x < -1 * this.sprites[i][0].width){
                this.layers[i].removeChild(this.sprites[i][0]);
                this.sprites[i].shift();
            }

            if(this.sprites[i][this.sprites[i].length-1].x + 
                    this.sprites[i][this.sprites[i].length-1].width < WindowWidth + 50){
                //add a sprite
                var width = (Math.ceil(Math.random()*4)+2)/12*WindowWidth;
                var height = WindowHeight/8 + i/this.numLayers*WindowHeight/4-(i*i)/(this.numLayers*this.numLayers)*WindowHeight/8;
                var sprite = new PIXI.Sprite(this.randomTexture());
                
                sprite.anchor.set(0,1);
                sprite.x = this.sprites[i][this.sprites[i].length-1].x + this.sprites[i][this.sprites[i].length-1].width;
                sprite.y = WindowHeight;
                sprite.scale.x = 1;
                sprite.scale.y = 1;
                sprite.width = width;
                sprite.height = height;
                sprite.tint = this.getColorGradient(this.baseColor, this.targetColor, this.numLayers, i);

                this.layers[i].addChild(sprite);
                this.sprites[i].push(sprite);

            }
        }
    }
}

//get a random texture
ParallaxBG.prototype.randomTexture = function(){
    var i = Math.floor(Math.random()*this.textures.length);
    return this.textures[i];
}

ParallaxBG.prototype.getColorGradient = function(startColor, finishColor, numSteps, step){
    var startR = (startColor >> 16) & 255;
    var startG = (startColor >> 8) & 255;
    var startB = (startColor) & 255;

    var finishR = (finishColor >> 16) & 255;
    var finishG = (finishColor >> 8) & 255;
    var finishB = (finishColor) & 255;

    // console.log('Current R: ' + currentR + ' G: ' + currentG + ' B: ' + currentB);
    // console.log('Target R: ' + targetR + ' G: ' + targetG + ' B: ' + targetB);
    // console.log(this.current);

    var r = Math.round(startR + (finishR - startR) * step/numSteps);
    var g = Math.round(startG + (finishG - startG) * step/numSteps);
    var b = Math.round(startB + (finishB - startB) * step/numSteps);
    
    var color = (r << 16) + (g << 8) + b;

    return color;
}

ParallaxBG.prototype.resize = function(){
    for(var i = 0; i < this.sprites.length; i++){
        var x = this.sprites[i][0].x;
        var height = WindowHeight/8 + i/this.numLayers*WindowHeight/4-(i*i)/(this.numLayers*this.numLayers)*WindowHeight/8;
        
        for(var j = 0; j < this.sprites[i].length; j++){
            this.sprites[i][j].x = x;
            this.sprites[i][j].y = WindowHeight;
            this.sprites[i][j].height = height;
            x += this.sprites[i][j].width;
        }
    }
}

ParallaxBG.prototype.destroy = function(){
    this.layers.forEach((e)=>{
        this.stage.removeChild(e);
        e.destroy({children:true, texture:true, baseTexture:true});
    });
}

DeathParticle = function(x,y,stage){
    this.container = new PIXI.Container();
    this.sprites = [];
    this.tex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    this.stage = stage;
    this.timer = 50;
    this.destroyed = false;

    for(var i = 0; i<100;i++){
        var s = new PIXI.Sprite(this.tex);
        s.x = x;
        s.y = y;
        s.vx = Math.sin(Math.random()*Math.PI+Math.PI/2) * Math.random() * 20;
        s.vy = Math.cos(Math.random()*Math.PI+Math.PI/2) * Math.random() * 20;
        s.ay = 0;
        s.anchor.set(0.5,0.5);
        s.scale.x = 1;
        s.scale.y = 1;
        s.width = 10;
        s.height = 10;
        this.container.addChild(s);
        this.sprites[i] = s;
    }

    stage.addChild(this.container);
}

DeathParticle.prototype.update = function(dt){
    if(this.timer > 0){
        this.sprites.forEach((e)=>{
            e.vy += e.ay * dt;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.alpha -= .02 * dt;
        });

        this.timer -= dt;
        if(this.timer <= 0){
            this.destroy();
            console.log('done with dp');
        }
    }
}

DeathParticle.prototype.destroy = function(dt){
    this.stage.removeChild(this.container);
    this.container.destroy({children:true});
    this.destroyed = true;
}