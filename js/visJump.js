VisualizerJump = function(audioInfo){
    this.name = 'Jump Man';

    // setup envronment variables
    this.audioInfo = audioInfo;

    this.container = new PIXI.Container();
};

//create assets required when stage is created
VisualizerJump.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;

    //create background
    this.bg = new PIXI.Sprite(makeBG2(0x000000,0xFFFFFF,64));    
    this.bg.anchor.set(0.5,0.5);
    this.bg.x = WindowWidth/2;
    this.bg.y = WindowHeight/2;
    this.bg.width = 2*Math.max(WindowWidth,WindowHeight);
    this.bg.height = 2*Math.max(WindowWidth,WindowHeight);
    this.bg.tint = Math.random() * 0xFFFFFF;

    this.stage.addChild(this.bg);

    this.buildings = [];
    var startX = 0;
    while(startX<WindowWidth){
        var sprite = new PIXI.Sprite.fromImage('images/whiteSquare.png')
        sprite.anchor.set(0,1);
        sprite.y = WindowHeight;
        sprite.x = startX;
        sprite.width = Math.random()*30+50;
        sprite.height = Math.random()*WindowHeight*.2+50;

        var r = Math.round(((this.bg.tint >> 16) & 255) * .5);
        var g = Math.round(((this.bg.tint >> 8) & 255) * .5);
        var b = Math.round(((this.bg.tint) & 255) * .5);

        sprite.tint = (r << 16) + (g << 8) + b;

        stage.addChild(sprite);
        this.buildings.push(sprite);
        startX += sprite.width * (Math.random()*.2+1);
    }

    this.bars = new Bars(0,WindowHeight * .2,WindowWidth, WindowHeight * .8,6,stage,audioInfo);
    
    //create player
    this.player = new JumpMan(120, WindowHeight - 160, 16, 32, stage);

    //add start
    this.platforms = [];
    this.platforms[0] = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.platforms[0].x = 20;
    this.platforms[0].y = WindowHeight - 80;
    this.platforms[0].scale.x = 1;
    this.platforms[0].scale.y = 1;
    this.platforms[0].vy = 0;
    this.platforms[0].vx = 0;
    this.platforms[0].width = 200;
    this.platforms[0].height = 40;
    this.stage.addChild(this.platforms[0]);

    //add end
    this.platforms[1] = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.platforms[1].x = WindowWidth - 220;
    this.platforms[1].y = 200;
    this.platforms[1].scale.x = 1;
    this.platforms[1].scale.y = 1;
    this.platforms[1].vy = 0;
    this.platforms[1].vx = 0;
    this.platforms[1].width = 200;
    this.platforms[1].height = 40;
    this.stage.addChild(this.platforms[1]);

    this.addPlatforms();

    this.eventHandlers = [];
    // update platform handlers
    for(var x = 0; x<this.audioInfo.numSlices; x++){
      
        var callback = function(index){
            this.platforms.forEach((e)=>{
                if(e.eq == index && e.tint == 0xFFFFFF)
                    e.tint = 0xFFFFFF * Math.random();

                if(e.eq == index)
                    e.ticker += 5;
            });
        }
        
        var h = this.audioInfo.addEvent(x,callback.bind(this,x));
        this.eventHandlers.push({
            index: x,
            handler: h
        });
    }

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    helpText.text = 'Jump\'!\n\n'
    + 'Press arrow keys to move and\n'
    + 'space to jump';
}

//stop visualizer functions that dont stop when events are stopped
VisualizerJump.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerJump.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.container.destroy({children:true, texture:true, baseTexture:true});
    this.platforms.forEach((e)=>{
        this.stage.removeChild(e);
        e.destroy();
    });

    this.buildings.forEach((e)=>{
        this.stage.removeChild(e);
        e.destroy();
    });

    
    this.player.destroy();
    
    this.bg.destroy(true);
    
    this.bars.destroy();

    
    this.stage.removeChild(this.goal);
    this.goal.destroy(true);
}

//resize all required elements when the window resizes
VisualizerJump.prototype.resize = function(){
    this.bg.width = 2*Math.max(WindowWidth,WindowHeight);
    this.bg.height = 2*Math.max(WindowWidth,WindowHeight);
}

//update the waveform information
VisualizerJump.prototype.update = function(dt){
    var prevState = this.player.state;
    this.player.update(dt,this.platforms,this.goal);
    this.platforms.forEach((e)=>{
        if(e.update)
            e.update(dt);
    });

    if(this.player.state == 'dead' && prevState != 'dead'
        ||this.player.state == 'win' && prevState != 'win'){
        this.bg.tint = (Math.random() * 196 << 16) + (Math.random() * 196 << 8) + Math.random() * 196;
        this.buildings.forEach((e)=>{

            var r = Math.round(((this.bg.tint >> 16) & 255) * .5);
            var g = Math.round(((this.bg.tint >> 8) & 255) * .5);
            var b = Math.round(((this.bg.tint) & 255) * .5);

            e.tint = (r << 16) + (g << 8) + b;
            e.height = Math.random()*WindowHeight*.2+50;
        })
        this.bg.rotation = Math.random()*Math.PI*2;
        this.addPlatforms();
    }
    this.bars.update(dt);
}

function makeBG2(startColor,finishColor,numSteps){
    var g = new PIXI.Graphics();

    var startR = (startColor >> 16) & 255;
    var startG = (startColor >> 8) & 255;
    var startB = (startColor) & 255;

    var finishR = (finishColor >> 16) & 255;
    var finishG = (finishColor >> 8) & 255;
    var finishB = (finishColor) & 255;

    for(var i = 0; i < numSteps; i++){

        var rC = Math.round(startR + (finishR - startR) * i/(numSteps-1));
        var gC = Math.round(startG + (finishG - startG) * i/(numSteps-1));
        var bC = Math.round(startB + (finishB - startB) * i/(numSteps-1));
        
        var color = (rC << 16) + (gC << 8) + bC;
        
        g.lineStyle(0, 0xFFFFFF, 0);
        g.fillAlpha = 1;
        g.beginFill(color);
        g.moveTo(0,WindowHeight * i/numSteps);
        g.lineTo(WindowWidth,WindowHeight * i/numSteps);
        g.lineTo(WindowWidth,WindowHeight * (i+1) /numSteps);
        g.lineTo(0,WindowHeight * (i+1) /numSteps);
        g.endFill();
    }

    var texture = app.renderer.generateTexture(g);
    return texture;
}

VisualizerJump.prototype.addPlatforms = function(){

    //if reset, destroy existing platforms
    if(this.platforms.length > 2){
        var n = this.platforms.length;
        for(var i = 2; i < n; i++){
            // console.log(this.platforms.length-1);
            this.stage.removeChild(this.platforms[this.platforms.length-1]);
            this.platforms[this.platforms.length-1].destroy();
            this.platforms.pop();
        }
    }

    this.goal = new PIXI.Sprite.fromImage('images/jumpStatue.png')
    this.goal.anchor.set(0.5,0.5);
    this.goal.x = WindowWidth - 120;
    this.goal.y = 180;
    this.goal.scale.x = 2;
    this.goal.scale.y = 2;
    this.stage.addChild(this.goal);

    for(var i = 2; i < 20; i++){
        this.platforms[i] = new PIXI.Sprite.fromImage('images/whiteSquare.png');
        this.platforms[i].x = Math.random()*WindowWidth*.6 + WindowWidth*.2;
        this.platforms[i].y = Math.random()*WindowHeight*.6 + WindowHeight*.3;
        this.platforms[i].anchor.set(0.5,0.5);
        this.platforms[i].scale.x = 1;
        this.platforms[i].scale.y = 1;
        this.platforms[i].vy = 0;
        this.platforms[i].vx = 0;
        this.platforms[i].width = 60;
        this.platforms[i].height = 20;
        this.platforms[i].alpha = 0;
        
        if(i>9){
            this.platforms[i].eq = Math.floor(Math.random() * 3);
            this.platforms[i].width = 10;
            this.platforms[i].height = 10;
        }
        
        //add update function
        if(Math.random()<1){
            this.platforms[i].startX = this.platforms[i].x;
            this.platforms[i].startY = this.platforms[i].y;
            this.platforms[i].ticker = Math.random()*Math.PI*2*100;
            this.platforms[i].moveX = Math.random()*100+50;
            this.platforms[i].moveY = Math.random()*100+50;
            this.platforms[i].prevX = this.platforms[i].x;
            this.platforms[i].prevY = this.platforms[i].y;
            this.platforms[i].moveType = Math.floor(Math.random()*3);
            this.platforms[i].offsetY = Math.random()*Math.PI*2*100;
            this.platforms[i].update = function(dt){

                if(this.alpha != 1)
                    this.alpha = Math.min(this.alpha + dt * .02,1);

                // console.log(this);
                this.ticker += dt;
                if(this.moveType == 0){
                    this.y = this.startY + Math.sin((this.ticker + this.offsetY)/100)*this.moveY;
                    this.x = this.startX + Math.sin((this.ticker)/100)*this.moveX;
                }

                else if (this.moveType == 1){
                    this.y = this.startY + Math.sin((this.ticker + this.offsetY)/100)*this.moveY;
                }

                else if (this.moveType == 2){
                    this.x = this.startX + Math.sin((this.ticker)/100)*this.moveX;
                }

                this.vx = (this.x - this.prevX)/dt;
                this.vy = (this.y - this.prevY)/dt;
                this.prevX = this.x;
                this.prevY = this.y;

                //handle color shift to white
                var currentR = (this.tint >> 16) & 255;
                var currentG = (this.tint >> 8) & 255;
                var currentB = (this.tint) & 255;

                var targetR = 255;
                var targetG = 255;
                var targetB = 255;

                for(var i = 0; i < 3; i++){
                    if(currentR < targetR) currentR += 1;
                    if(currentR > targetR) currentR -= 1;
                    if(currentB < targetB) currentB += 1;
                    if(currentB > targetB) currentB -= 1;
                    if(currentG < targetG) currentG += 1;
                    if(currentG > targetG) currentG -= 1;        
                }

                this.tint = (currentR << 16) + (currentG << 8) + currentB;

            }.bind(this.platforms[i]);
        }

        this.stage.addChild(this.platforms[i]);
    }
}

//JumpMan - interactive character for visualizer
JumpMan = function(x,y,width,height,stage){
    this.state = 'idle';
    this.score = 0;

    this.idleTex = new PIXI.Texture.fromImage('images/jumpmanidle.png');
    this.moveTex = new PIXI.Texture.fromImage('images/jumpmanrun.png');
    this.jumpTex = new PIXI.Texture.fromImage('images/jumpmanjump.png');

    // console.log(this.idleTex);
    //sprite info
    this.startX = x;
    this.startY = y;
    this.sprite = new PIXI.Sprite(this.idleTex);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,1);
    
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.platformVX = 0;
    this.sprite.platformVY = 0;
    this.sprite.scale.x = 1;
    this.sprite.scale.y = 1;
    this.sprite.ax = 0;
    this.sprite.ay = .6;
    this.sprite.width = width;
    this.sprite.height = height;

    this.indicator = new PIXI.Sprite.fromImage('images/jumpindicator.png');
    this.indicator.x = x;
    this.indicator.y = 10;
    this.indicator.anchor.set(0.5,0.5);
    this.indicator.rotation = Math.PI;
    this.indicator.visible = false;

    
    this.moveSpeed = width*0.0625;
    this.airControlSpeed = width*0.0104;
    this.jumpSpeed = width*0.35;
    this.jumpSpeedInit = width*.35;
    this.jumpTimer = 0;
    
    this.autoMoveTimer = 0;
    this.amJumpStart = false;
    this.onGround = false;
    
    this.stage = stage;

    this.deathParticle = [];

    this.addKeyHandlers();

    stage.addChild(this.sprite);
    stage.addChild(this.indicator);
    this.destroyed = false;
}

JumpMan.prototype.update = function(dt,colliders,goal){

    //if win - reset
    if(this.state == 'win'){
        
        this.sprite.x += (this.startX - this.sprite.x)*dt/20;
        this.sprite.y += (this.startY - this.sprite.y)*dt/20;

        if(Math.abs(this.startX - this.sprite.x)<5 && 
                Math.abs(this.startY - this.sprite.y)<5){
            this.sprite.x = this.startX;
            this.sprite.y = this.startY;
            this.state = 'idle';
            this.sprite.vx = 0;
            this.sprite.vy = 0;
            this.sprite.platformVX = 0;
            this.sprite.platformVY = 0;

            this.onGround = false;
        }

        if(this.autoMoveTimer == 0){
            this.autoMove = false;   
            this.jump = false;
            this.moveDown = false; 
            this.moveLeft = false;
            this.moveRight = false;
            this.moveUp = false;
            this.waitTimer = 300;
        }
    }

    //if dead - reset
    if(this.state == 'dead'){
        // console.log('dead');
        
        this.sprite.x += (this.startX - this.sprite.x)*dt/20;
        this.sprite.y += (this.startY - this.sprite.y)*dt/20;

        if(Math.abs(this.startX - this.sprite.x)<5 && 
                Math.abs(this.startY - this.sprite.y)<5){
            this.sprite.x = this.startX;
            this.sprite.y = this.startY;
            this.state = 'idle';
            this.sprite.vx = 0;
            this.sprite.vy = 0;
            this.sprite.platformVX = 0;
            this.sprite.platformVY = 0;

            this.onGround = false;
        }

        if(this.autoMoveTimer == 0){
            this.autoMove = false;   
            this.jump = false;
            this.moveDown = false; 
            this.moveLeft = false;
            this.moveRight = false;
            this.moveUp = false;
            this.waitTimer = 300;
        }
    }

    //if idle, move when you get an input
    if(this.state == 'idle'){
        this.sprite.alpha = 1;
        this.state = 'playing';
    }

    //if below threshold - be dead
    if(this.state == 'playing'){
        
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
                        if(this.sprite.vx - s.vx < 0){
                            if(!damperVX){
                                this.sprite.vx = s.vx - (this.sprite.vx - s.vx) * .1;
                                damperVX = true;
                            }
                        }
                        break;
                    case 'right':
                        if(this.sprite.vx - s.vx > 0){
                            this.sprite.platformVX = s.vx;
                            if(!damperVX){
                                this.sprite.vx = s.vx - (this.sprite.vx - s.vx) * .1;
                                damperVX = true;
                            }
                        }
                        break;
                    case 'top':
                        if(this.sprite.vy - s.vy < 0){
                                if(!damperVY){
                                this.sprite.vy = s.vy - (this.sprite.vy - s.vy) * .1;
                                damperVY = true;
                            }
                        }
                        break;
                    case 'bottom':
                        if(this.sprite.vy - s.vy > 0){
                            this.onGround = true;

                            if(!damperVY){
                                this.sprite.vy = s.vy;
                                damperVY = true;
                            }

                            this.sprite.platformVX = s.vx;
                            // console.log('bottom');
                        }
                        break;
                    default: break;
                }
                //console.log(s.vx, s.vy);
            }.bind(this)
        );

        // console.log(this.onGround);

        
        //if colliding with platform add x velocity
        if(col){
            this.sprite.vx += (this.sprite.platformVX - this.sprite.vx) * .15 * dt;
            if(Math.abs(this.sprite.vx - this.sprite.platformVX) < .1)
                this.sprite.vx = this.sprite.platformVX;
        }

        //console.log(col,this.sprite.platformVX,this.sprite.vx);
        var mVX = 0;
        if(this.onGround && this.moveLeft) mVX -= this.moveSpeed;
        else if (!this.onGround && this.moveLeft) mVX -= this.airControlSpeed;
        if(this.onGround && this.moveRight) mVX += this.moveSpeed;
        else if (!this.onGround && this.moveRight) mVX += this.airControlSpeed;

        //handle jumping stuff
        var mVY = 0;
        // if(this.onGround && this.jump) this.sprite.vy -= this.jumpSpeed;//this.onGround && 

        //handle automove
        this.autoMoveTimer -= dt;
        if(this.autoMoveTimer <= 0){
            this.autoMoveTimer = 0;
            if(this.waitTimer > 0)
                this.waitTimer -= dt;
            else{

                if (this.onGround && this.amJumpStart && this.jumpTimer <= 0) {
                    console.log('wait')
                    this.amJumpStart = false;
                    this.moveRight = false;
                    this.jump = false;
                    this.waitTimer = 50;
                }
                
                else if(this.onGround && this.sprite.vx < (Math.random()*3+2)){
                    // console.log('moveright');
                    this.moveRight = true;
                    this.jump = false;
                }
                else if(this.onGround && this.sprite.vx > (Math.random()*3+2)){
                    // console.log('jump');
                    this.moveRight = false;
                    this.jump = true;
                    this.amJumpStart = true;
                }
                else if (this.amJumpStart && this.jumpTimer > 0){
                    console.log('continue jump');
                    this.moveRight = false;
                    this.jump = true;
                }
            }
        }

        if(this.onGround && this.jump) {
            mVY -= this.jumpSpeed;
            this.sprite.platformVY = 0;
            this.jumpTimer = 5;
        }

        if(!this.onGround && this.jumpTimer > 0 && this.jump){
            mVY -= this.jumpSpeed;
        }

        //update velocity and location
        this.sprite.vx += this.sprite.ax * dt + mVX * dt;
        this.sprite.vy += this.sprite.ay * dt + mVY * Math.min(dt,this.jumpTimer);

        this.sprite.x  += this.sprite.vx * dt;
        this.sprite.y  += this.sprite.vy * dt;

        this.jumpTimer = Math.max(this.jumpTimer - dt,0);

        
        //check for death
        if(this.sprite.y > WindowHeight * 1.1){
            this.sprite.alpha = .5;
            this.state = 'dead';
        }



        //check for goal
        if(b.hit(this.sprite, goal)){
            this.sprite.alpha = .5;
            this.state = 'win';
            this.score++;
        }



        //determine animation
        if(Math.abs(this.sprite.vx - this.sprite.platformVX) > .1 && this.onGround)
            this.sprite.texture = this.moveTex;
        else if(this.onGround)
            this.sprite.texture = this.idleTex;
        else
            this.sprite.texture = this.jumpTex;

        if(this.sprite.vx < 0){
            this.sprite.scale.x = -1;
        }
        else
            this.sprite.scale.x = 1;

        //update indicator and make visible if off screen
        this.indicator.x = this.sprite.x;

        if(this.sprite.y < 0)
            this.indicator.visible = true;
        else
            this.indicator.visible = false;
    }
    return this.state;
}

JumpMan.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.removeKeyHandlers();
    this.indicator.destroy(true);
    this.sprite.destroy(true);
}

JumpMan.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        // console.log(ev);
        this.autoMoveTimer = 500;

        if(ev.key == 'ArrowUp'){
            if(this.autoMove){
                this.autoMove = false;   
                this.jump = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.jump = true;
        }

        if(ev.key == 'ArrowDown'){
            if(this.autoMove){
                this.autoMove = false;   
                this.jump = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveDown = true;
        }

        if(ev.key == 'ArrowLeft'){
            if(this.autoMove){
                this.autoMove = false;   
                this.jump = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
            }
            this.moveLeft = true;
        }

        if(ev.key == 'ArrowRight'){
            if(this.autoMove){
                this.autoMove = false;   
                this.jump = false;
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
        // console.log(ev);

        
        if(ev.key == 'ArrowUp')
            this.jump = false;

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

JumpMan.prototype.removeKeyHandlers = function(){
    this.keyHandler = window.removeEventListener("keydown",this.keyHandler, false);
    this.keyHandler = window.removeEventListener("keyup",this.keyHandler, false);    
}

JumpMan.prototype.resize = function(x,y){
    this.startX = x;
    this.startY = y;  
}

Bars = function(x,y,width,height,numBars,stage,audioInfo){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.numBars = numBars;
    this.stage = stage;
    this.audioInfo = audioInfo;

    this.barWidth = width/numBars;
    this.barHeight = height;
    
    this.barSprites = [];
    this.barIndex = [];

    this.updateTimer = 2;

    for(var i = 0; i < numBars; i++){
        var s = new PIXI.Sprite.fromImage('images/whiteSquare.png');
        s.anchor.set(0,1);
        s.x = this.x + this.barWidth * i + this.barWidth * .1;
        s.y = this.y + this.barHeight;
        s.scale.x = 1;
        s.scale.y = 1;
        s.width = this.barWidth * .8;
        s.height = this.barHeight;
        s.tint = (Math.floor(Math.random()*16+13+0.5*(numBars-6)) << 16) 
                + (Math.floor(Math.random()*8+0.5*(numBars-6)) << 8) 
                + Math.floor(Math.random()*8+0.5*(numBars-6));
        stage.addChild(s);
        this.barSprites[i] = s;
        this.barIndex[i] = Math.round(audioInfo.current.length * i / numBars);
    }
}

Bars.prototype.update = function (dt){
    for(var i = 0; i < this.numBars; i++){
            var val = audioInfo.current[this.barIndex[i]]/255;
            //console.log(val);
            this.barSprites[i].height = this.barHeight * val;
    }
}

Bars.prototype.resize = function (){
    
}

Bars.prototype.destroy = function (){
    this.barSprites.forEach((e)=>{
        e.destroy();
    });
}