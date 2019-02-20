VisPong = function(audioInfo){
    this.name = 'Pong Style';
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.particleContainer = new PIXI.Container();
    this.particleEmitters = new Array(0);
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
    this.score = {
        p1: 0,
        p2: 0
    }
};

//create assets required when stage is created
VisPong.prototype.start = function(stage){
    app.renderer.backgroundColor = 0xFFFFFF;
    //create waveform sprite
    this.stage = this.stage;
    stage.addChild(this.particleContainer);
    stage.addChild(this.container);

    this.playerOne = new Paddle(50, 150, this.container, 1, this);
    this.playerTwo = new Paddle(WindowWidth - 50, 150, this.container, 2, this);
    this.ball = new Ball(WindowWidth/2, WindowHeight/2, this.container, 
            this.playerOne, this.playerTwo, this);

    this.scoreText = new PIXI.Text();
    this.scoreText.style = {
        fill: '#FFFFFF',
        font: '100px',
        stroke: "#000000",
        strokeThickness: 6,
        fontFamily: 'Press Start 2P, monospace'
    };
    this.scoreText.anchor.set(0.5,0.5);
    this.scoreText.x = WindowWidth/2;
    this.scoreText.y = WindowHeight/4;
    this.scoreText.text = '0 - 0'
    this.container.addChild(this.scoreText);
    this.scoreColor = new ColorShift();
    this.scoreColor.stepSpeed = 5;
    this.pulseTimer = 0;

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    this.updatePulseHandler = this.audioInfo.addEvent(0,()=>{
        this.pulseTimer = 10;
    });

    helpText.text = "I bounce my ball back and forth\nPlayer 1 - W, D\nPlayer 2 - Up Arrow, Down Arrow";
}

//stop visualizer functions that dont stop when events are stopped
VisPong.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisPong.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    this.playerOne.destroy();
    this.playerTwo.destroy();
    this.ball.destroy();

    //destroy all assets
    this.container.destroy({children:true, texture:true, baseTexture:true});
    this.particleContainer.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisPong.prototype.resize = function(){
}

//update the waveform information
VisPong.prototype.update = function(dt){
    
    this.pulseTimer = Math.max(this.pulseTimer - dt, 0);

    this.playerOne.update(dt);
    this.playerTwo.update(dt);
    this.ball.update(dt);
    this.particleEmitters.forEach((e,i)=>{
        var x = e.update(dt)
        if(e.destroyed)
            this.particleEmitters.splice(1,i);
    });

    if(this.displayScoreTimer > 0){
        this.displayScoreTimer -= dt;
        this.scoreText.tint = this.scoreColor.current;
        this.scoreText.visible = true;
        this.scoreColor.step();
    }
    else
        this.scoreText.visible = false;
}

Paddle = function(x, y, stage, playerNum, base){
    this.stage = stage;
    this.base = base;
    this.playerNum = playerNum;

    //sprite info
    this.paddleTex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    
    this.startX = x;
    this.startY = y;
    
    this.sprite = new PIXI.Sprite(this.paddleTex);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.height = 150;
    this.sprite.width = 20;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.tint = 0xFFFFFF;

    this.spriteBG = new PIXI.Sprite(this.paddleTex);
    this.spriteBG.x = x;
    this.spriteBG.y = y;
    this.spriteBG.height = 156;
    this.spriteBG.width = 26;
    this.spriteBG.anchor.set(0.5, 0.5);
    this.spriteBG.tint = 0;

    this.autoMove = true;
    this.autoMoveTimer = 0;
    this.moveSpeed = WindowHeight / 50;

    this.stage.addChild(this.spriteBG);
    this.stage.addChild(this.sprite);
    

    this.moveUp = false;
    this.moveDown = false;

    if(playerNum == 1){
        this.upKey = 'w';
        this.downKey = 's';
    }
    
    else {
        this.upKey = 'ArrowUp';
        this.downKey = 'ArrowDown';
    }
    
    this.addKeyHandlers();    
}

Paddle.prototype.update = function(dt){
    //automove
    if(this.autoMove){
        this.moveDown = false;
        this.moveUp = false;

        if((this.base.ball.sprite.x < WindowWidth/2 && this.playerNum == 1) ||
            (this.base.ball.sprite.x > WindowWidth/2 && this.playerNum == 2) ){
                
            if(this.base.ball.sprite.y > this.sprite.y + 10)
                this.moveDown = true;
            
            if(this.base.ball.sprite.y < this.sprite.y - 10)
                this.moveUp = true;
        }
    }
    else{
        this.autoMoveTimer -= dt;
        if(this.autoMoveTimer < 0){
            this.autoMove = true;
        }
    }

    //move the damn thing
    if(this.moveUp)
        this.sprite.y -= dt * this.moveSpeed;
    if(this.moveDown)
        this.sprite.y += dt * this.moveSpeed;

    //keep in play
    if(this.sprite.getBounds().bottom > WindowHeight){
        var offsetY = this.sprite.getBounds().bottom - WindowHeight;
        this.sprite.y -= offsetY;
    }

    if(this.sprite.getBounds().top < 0){
        var offsetY = this.sprite.getBounds().top;
        this.sprite.y -= offsetY;
    }

    this.spriteBG.x = this.sprite.x;
    this.spriteBG.y = this.sprite.y;

}

Paddle.prototype.destroy = function(){
    this.removeKeyHandlers();
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}

Paddle.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        //console.log(ev);
        this.autoMoveTimer = 500;

        if(ev.key == this.upKey){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveDown = false; 
            }
            this.moveUp = true;
        }

        if(ev.key == this.downKey){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
            }
            this.moveDown = true;
        }

     }.bind(this);

    this.keyHandlerUp = function(ev){
        //debug stuff
        ev = ev || window.event;
        // console.log(ev);

        
        if(ev.key == this.upKey)
            this.moveUp = false;

        if(ev.key == this.downKey)
            this.moveDown = false;

    }.bind(this);

    window.addEventListener("keydown", this.keyHandlerDown, false);
    window.addEventListener("keyup", this.keyHandlerUp, false);
}

Paddle.prototype.removeKeyHandlers = function(){
    this.keyHandler = window.removeEventListener("keydown",this.keyHandler, false);
    this.keyHandler = window.removeEventListener("keyup",this.keyHandler, false);    
}

Ball = function(x, y, stage, p1, p2, base){
    this.stage = stage;
    this.p1 = p1;
    this.p2 = p2;
    this.colliders = [p1.sprite, p2.sprite];
    this.base = base;

    //sprite info
    this.paddleTex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    
    this.startX = x;
    this.startY = y;
    
    this.sprite = new PIXI.Sprite(this.paddleTex);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.height = 20;
    this.sprite.width = 20;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.tint = 0;

    this.spriteBG = new PIXI.Sprite(this.paddleTex);
    this.spriteBG.x = x;
    this.spriteBG.y = y;
    this.spriteBG.height = 26;
    this.spriteBG.width = 26;
    this.spriteBG.anchor.set(0.5, 0.5);
    this.spriteBG.tint = 0;

    this.resetTimer = 0;

    if(Math.random() < .5)
        this.sprite.vx = 6;
    else
        this.sprite.vx = -6;

    this.sprite.vy = (1 - 2 * Math.random()) * WindowHeight / 150;

    this.stage.addChild(this.spriteBG);
    this.stage.addChild(this.sprite);

    this.moveUp = false;
    this.moveDown = false;
}

Ball.prototype.update = function(dt){
    if(this.resetTimer > 0){
        this.resetTimer -= dt;
    }
    else{
        //move ball
        this.sprite.x += this.sprite.vx * dt;
        this.sprite.y += this.sprite.vy * dt;

        //keep in play
        if(this.sprite.x < 0){
            //p2 scores
            this.resetTimer = 150;
            this.base.score.p2 += 1;
            this.base.displayScoreTimer = 100;
            this.base.scoreText.text = this.base.score.p1 + " - " + this.base.score.p2;
            this.sprite.x = WindowWidth/2;
            this.sprite.y = WindowHeight/2;
            if(Math.random() < .5)
                this.sprite.vx = 6;
            else
                this.sprite.vx = -6;
        
            this.sprite.vy = (1 - 2 * Math.random()) * WindowHeight / 150;
        }

        if(this.sprite.x > WindowWidth){
            //p1 scores
            this.resetTimer = 150;
            this.base.score.p1 += 1;
            this.base.displayScoreTimer = 100;
            this.base.scoreText.text = this.base.score.p1 + " - " + this.base.score.p2;
            this.sprite.x = WindowWidth/2;
            this.sprite.y = WindowHeight/2;
            if(Math.random() < .5)
                this.sprite.vx = 6;
            else
                this.sprite.vx = -6;
        
            this.sprite.vy = (1 - 2 * Math.random()) * WindowHeight / 150;
        }
        
        if((this.sprite.y < 0 && this.sprite.vy < 0)|| 
            (this.sprite.y > WindowHeight && this.sprite.vy > 0)){
            //bounce for now
            this.sprite.vy *= -1;

            this.base.particleEmitters.push(new ParticleEmitter(
                this.sprite.x,
                this.sprite.y,
                this.base.particleContainer,
                this.particleColor,
                0, 0, this.base
            ));
        }

        var color = (Math.floor(Math.random()*audioInfo.max[0]) << 16) 
            + (Math.floor(Math.random()*audioInfo.max[3]) << 8) 
            + Math.floor(Math.random()*audioInfo.max[6]);
        this.particleColor = color;

        b.hit(
            this.sprite,
            this.colliders,
            true, true, false,

            //handle collision
            function(c,s){
                //change color and explode
                this.sprite.tint = randomColor(128,255,128,255,128,255);
                this.sprite.vx *= 1.001;
                
                var dir = {
                    x: (this.sprite.x - s.x)/(Math.abs(this.sprite.x - s.x) + Math.abs(this.sprite.y - s.y)),
                    y: (this.sprite.y - s.y)/(Math.abs(this.sprite.x - s.x) + Math.abs(this.sprite.y - s.y))
                }
                
                this.sprite.vy += dir.y * 2;
                
                this.base.particleEmitters.push(new ParticleEmitter(
                    this.sprite.x,
                    this.sprite.y,
                    this.base.particleContainer,
                    this.particleColor,
                    dir.x, dir.y, this.base
                ));

                console.log(s);

            }.bind(this));
        }

        this.spriteBG.x = this.sprite.x;
        this.spriteBG.y = this.sprite.y;
}

Ball.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}

function randomColor(minR,maxR,minG,maxG,minB,maxB){
    var color = (Math.floor(Math.random()*(maxR-minR)+minR) << 16) + (Math.floor(Math.random()*(maxG-minG)+minG) << 8) + Math.floor(Math.random()*(maxB-minB)+minB);
    return color;
}

ParticleEmitter = function(x,y,stage,tint,dirX,dirY,base){
    this.container = new PIXI.Container();
    this.base = base;
    this.sprites = [];
    this.tex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    this.stage = stage;
    this.timer = 1000;
    this.initTimer = this.timer;
    this.destroyed = false;

    for(var i = 0; i<100;i++){
        var s = new PIXI.Sprite(this.tex);
        s.base = this;
        s.x = x;
        s.y = y;
        s.vx = Math.sin(Math.random()*Math.PI*2) * Math.random() * 21;
        s.vx += dirX * 20;
        s.vy = Math.cos(Math.random()*Math.PI*2) * Math.random() * 21;
        s.vy += dirY * 20;
        s.ay = 0;
        s.ax = 0;
        s.anchor.set(0.5,0.5);
        s.scale.x = 1;
        s.scale.y = 1;
        s.width = 10 + Math.random () * 20;
        s.height = s.width;
        s.startSize = s.width;
        s.vx *= 15/s.width;
        s.vy *= 15/s.width;

        if(Math.random() < .1)
            s.pulse = true;

        s.tint = tint;
        this.container.addChild(s);
        this.sprites[i] = s;
    }

    stage.addChild(this.container);
}

ParticleEmitter.prototype.update = function(dt){
    if(this.timer > 0){
        this.sprites.forEach((e)=>{
            //setup gravity well
            var c = {
                x: WindowWidth/2,
                y: WindowHeight/2
            }

            var distance = Math.hypot(e.x - c.x, e.y - c.y);

            var dir = {
                x: (c.x - e.x)/(Math.abs(distance)),
                y: (c.y - e.y)/(Math.abs(distance))
            }

            var at = Math.atan(dir.x/dir.y);

            var g = 1000;
            if(audioInfo.current[0]/audioInfo.max[0] > .98)
                g = 7500;

            var gx = g * 1/(distance*distance) * dir.x * 35 / e.startSize;
            var gy = g * 1/(distance*distance) * dir.y * 35 / e.startSize;

            //console.log(gx,gy);

            e.vx += e.ax * dt + gy * dt + gx  * dt * .1;
            e.vy += e.ay * dt - gx * dt + gy  * dt * .1;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.vx *= (1 - .05 * dt);
            e.vy *= (1 - .05 * dt);

                //keep in play
            if((e.x < 0 && e.vx < 0)|| 
                (e.x > WindowWidth && e.vx > 0)){
                //bounce for now
                e.vx *= -.9;
            }

            if((e.y < 0 && e.vy < 0)|| 
                (e.y > WindowHeight && e.vy > 0)){
                //bounce for now
                e.vy *= -.9;
            }

            if(this.timer/this.initTimer < .5){
                e.startSize =  Math.max(e.startSize * (1 - dt / (this.initTimer/3)) , .001);
            }
            
            if(this.base.pulseTimer > 5 && e.pulse){
                e.width = e.startSize * 1.5;
                e.height = e.startSize * 1.5;
            }

            if(e.width > e.startSize){
                e.width *= (1 - .05 * dt);
                e.height *= (1 - .05 * dt);
            }
        });

        

        this.timer -= dt;
        if(this.timer <= 0){
            this.destroy();
            console.log('done with dp');
        }
    }
}

ParticleEmitter.prototype.destroy = function(dt){
    this.stage.removeChild(this.container);
    this.container.destroy({children:true});
    this.destroyed = true;
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