VisAzBlaster = function(audioInfo){
    this.name = 'Az-Blaster';
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.container = new PIXI.Container();
    this.particleContainer = new PIXI.Container();

};

//create assets required when stage is created
VisAzBlaster.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;

    //add update function
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });

    this.player = new AzShip(WindowWidth/2, WindowHeight/2, this.container, this);

    this.stage.addChild(this.particleContainer);
    this.stage.addChild(this.container);
    

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.objects = [];

    this.objects[0] = new AzRock(100, 100, 1, this.container, this);

    helpText.text = 'Shoot those rocks!\nArrow keys to move\nSpace to shoot';

    this.blinkHandler = this.audioInfo.addEvent(0,()=>{
        this.particles.forEach((e,s)=>{
            e.sprites.forEach((e,s)=>{
                if(e.blink){
                    e.tint = 0xFFFFFF;
                    e.bigTimer = 20;
                }
            });
        });
    });
}

//stop visualizer functions that dont stop when events are stopped
VisAzBlaster.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisAzBlaster.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);

    //destroy container
    this.stage.removeChild(this.particleContainer);
    this.stage.removeChild(this.container);
    
    this.container.destroy({children:true, texture:true, baseTexture:true});
    this.particleContainer.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisAzBlaster.prototype.resize = function(){
}

//update the waveform information
VisAzBlaster.prototype.update = function(dt){
    this.player.update(dt);
    this.projectiles.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
            this.projectiles.splice(i,1);
    });

    this.objects.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
        this.objects.splice(i,1);
    });

    this.particles.forEach((e,i)=>{
        e.update(dt, this.wind);
        if(e.destroyed){
            this.particles.splice(i,1);
            e.destroy();
        }
    });

    if(this.objects.length == 0){
        this.objects[0] = new AzRock(100, 100, 1, this.container, this);
    }
}

function spriteWrap(sprite){
    if(sprite.x < 0)
        sprite.x = (WindowWidth - 1);
    
    if(sprite.x > WindowWidth)
        sprite.x = 1;
    
    if(sprite.y < 0)
        sprite.y = WindowHeight -1;

    if(sprite.y > WindowHeight)
        sprite.y = 1;
}

AzShip = function(x,y,stage,base){
    this.state = 'idle';
    this.score = 0;
    this.stage = stage;
    this.base = base;

    // console.log(this.idleTex);
    //sprite info
    this.startX = x;
    this.startY = y;
    this.sprite = new PIXI.Sprite.fromImage('images/azShip.png');
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);
    
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.ax = 0;
    this.sprite.ay = 0;

    this.sprite.scale.x = 1;
    this.sprite.scale.y = 1;
    this.sprite.width = 32;
    this.sprite.height = 32;

    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.fire = false;
    this.fireCooldown = 0;
    this.fireSpeed = 25;

    this.autoMove = true;

    this.turnSpeed = .06;
    this.moveThrust = .05;
    this.maxSpeed = 10   ;

    stage.addChild(this.sprite);

    this.exhaust = [];
    this.exhaustContainer = this.base.particleContainer;

    this.state = "moving";

    this.addKeyHandlers();
}

AzShip.prototype.update = function(dt){
    if(this.state == "moving"){

        if(this.autoMove){
            this.getInputs(dt);
        }
        else{
            this.autoMoveTimer -= dt;
            if(this.autoMoveTimer < 0)
                this.autoMove = true;
        }

        if(this.moveRight)
            this.sprite.rotation = (this.sprite.rotation + this.turnSpeed * dt) % (Math.PI * 2);


        if(this.moveLeft)
            this.sprite.rotation = (this.sprite.rotation - this.turnSpeed * dt)  %(Math.PI * 2);

        var tx = 0;
        var ty = 0;

        if(this.moveUp){
            tx = Math.sin(this.sprite.rotation) * this.moveThrust;
            ty = -1 * Math.cos(this.sprite.rotation) * this.moveThrust;
        }

        this.sprite.vx += this.sprite.ax * dt + tx * dt;
        this.sprite.vy += this.sprite.ay * dt + ty * dt;
        
        //limit speed
        var speed = Math.hypot(this.sprite.vx,this.sprite.vy);
        if(speed > this.maxSpeed){
            //clamp down to max speed
            var ratio = this.maxSpeed/speed;
            this.sprite.vx *= ratio;
            this.sprite.vy *= ratio;
        }
        
        
        this.sprite.x += this.sprite.vx * dt;
        this.sprite.y += this.sprite.vy * dt;

        //wrap around if required
        spriteWrap(this.sprite);

        //fire projectiles if holding space
        this.fireCooldown = Math.max(this.fireCooldown - dt,0)
        if(this.fireCooldown <= 0 && this.fire){
            this.fireCooldown = 5;
            //console.log('fire!');
            this.base.projectiles.push(new AzProjectile(this, this.stage, this.base));
        }

        //check for hits after moving
        if(this.base.objects.length > 0){
            var hit = false;
            b.hit(this.sprite,this.base.objects.map((e)=>{return e.sprite;}),
                    false,false,false,
                    function(c,s){
                        hit = true;
                        this.hitSprite = s;
                        //console.log(c,s);
                    }.bind(this));
            if(hit)
                this.state = "explode";
        }
    }

    if(this.state == "explode"){
        //console.log(this.impact);
        this.sprite.visible = false;
        for(var x = 0 ; x < 3; x++)
            this.base.particles.push(new AzParticle(this.sprite.x,this.sprite.y,
                this.base.particleContainer,this.sprite.tint));
        this.exhaust.forEach((e,i)=>{
            e.vx += 75/(e.x - (this.sprite.x + this.hitSprite.x)/2);
            e.vy += 75/(e.y - (this.sprite.y + this.hitSprite.y)/2);
        });

        this.sprite.x = WindowWidth/2;
        this.sprite.y = WindowHeight/2;
        this.sprite.vx = 0;
        this.sprite.vy = 0;
        this.sprite.rotation = 0;
        this.state = "respawn";
        this.respawnTimer = 300;
    }

    if(this.state == "respawn"){
        this.respawnTimer -= dt;
        
        if(this.respawnTimer%100 < 50)
            this.sprite.visible = true;
        else 
            this.sprite.visible = false;
        
        if(this.respawnTimer < 0){
            this.state = "moving";
            this.sprite.visible = true;
        }
    }

    this.exhaustUpdate(dt);
}

AzShip.prototype.getInputs = function(dt){

    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.fire = false;

    //get nearest enemy
    var nearest = {};
    if(this.base.objects.length>0){
        nearest = this.base.objects[0];
        this.base.objects.forEach((e)=>{
            var newMinX = Math.min(
                Math.abs(this.sprite.x - e.sprite.x),
                Math.abs((WindowWidth - this.sprite.x) + e.sprite.x));
            var newMinY = Math.min(
                Math.abs(this.sprite.y - e.sprite.y),
                Math.abs((WindowHeight - this.sprite.y) + e.sprite.y));
            var currentMinX = Math.min(
                Math.abs(this.sprite.x - nearest.sprite.x),
                Math.abs((WindowWidth - this.sprite.x) + nearest.sprite.x));
            var currentMinY = Math.min(
                Math.abs(this.sprite.y - nearest.sprite.y),
                Math.abs((WindowHeight - this.sprite.y) + nearest.sprite.y));

            //if(Math.hypot((this.sprite.x - e.sprite.x) % WindowWidth, (this.sprite.y-e.sprite.y) % WindowHeight)<
            //   Math.hypot((this.sprite.x - nearest.sprite.x) % WindowWidth, (this.sprite.y-nearest.sprite.y)% WindowHeight))
            //    nearest = e;
            
            if(Math.hypot(newMinX, newMinY)< Math.hypot(currentMinX,currentMinY))
                nearest = e;
        });
    }

    //determine heading...
    if(nearest){
        //find closest iteration
        var minDist = Math.hypot(nearest.sprite.x - this.sprite.x, nearest.sprite.y - this.sprite.y);
        var target = {x: nearest.sprite.x, y: nearest.sprite.y};
        
        for(var i = -1; i <= 1; i++){
            for(var j = -1; j <= 1; j++){
                if(minDist > Math.hypot(nearest.sprite.x - i*WindowWidth - this.sprite.x, 
                        nearest.sprite.y - j*WindowHeight - this.sprite.y)){
                    minDist = Math.hypot(nearest.sprite.x - i*WindowWidth - this.sprite.x, 
                            nearest.sprite.y - j*WindowHeight - this.sprite.y);
                    target.x = nearest.sprite.x - i*WindowWidth;
                    target.y = nearest.sprite.y - j*WindowHeight;
                }
            }
        }



        var heading = (Math.atan2(
            target.y - this.sprite.y,    
            target.x - this.sprite.x                
            ) + Math.PI/2)  + (Math.random() * .5 - .25) % (Math.PI*2);

        //rotate positive
        if((this.sprite.rotation - heading) > .1 && (this.sprite.rotation - heading) < Math.PI){
            this.moveLeft = true;
        }
        //rotate negative
        else if((this.sprite.rotation - heading) < -.1 || (this.sprite.rotation - heading) > Math.PI){
            this.moveRight = true;
        }

        else if ((this.sprite.rotation - heading) > -1 && (this.sprite.rotation - heading) < 1){
            this.fire = true;

            var dist = Math.hypot(this.sprite.x - nearest.sprite.x ,this.sprite.y - nearest.sprite.y);
            console.log(nearest, this.sprite);
            if(dist > 400){
                this.moveUp = true;
            }
        }
    }
};

AzShip.prototype.exhaustUpdate = function(dt){
    
    //create exhaust if required
    if(this.moveUp && this.state == "moving"){
        var s = new PIXI.Sprite.fromImage('images/whiteSquare.png');
        s.lifeSpan = 50;
        
        var fx = Math.sin(this.sprite.rotation);
        var fy = -1 * Math.cos(this.sprite.rotation) ;
        
        s.x = this.sprite.x - fx * 10;
        s.y = this.sprite.y - fy * 10;
        s.vx = fx * -3 + this.sprite.vx + (Math.random() * .6 - .3) * fy;
        s.vy = fy * -3 + this.sprite.vy + (Math.random() * .6 - .3) * fx;
        s.tint = 0xFF0000;
        
        s.width = 15;
        s.height = 15;
        s.anchor.set(0.5,0.5);
        this.exhaustContainer.addChild(s);
        this.exhaust.push(s);
    }

    this.exhaust.forEach((e,i)=>{
        e.lifeSpan -= dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        spriteWrap(e);
        e.scale.x *= 1 - .1 * dt;
        e.scale.y *= 1 - .1 * dt;
        if(e.lifeSpan < 0){
            this.exhaustContainer.removeChild(e);
            e.destroy();
            this.exhaust.splice(i,1);
        }
    });

}

AzShip.prototype.destroy = function(){
    this.sprite.destroy();
    this.exhaust.forEach((e)=>{
        e.destroy();
    });
}

AzShip.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        this.autoMoveTimer = 500;

        if(ev.key == 'ArrowUp'){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
                this.fire = false;
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
                this.fire = false;
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
                this.fire = false;
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
                this.fire = false;
            }
            this.moveRight = true;
        }

        if(ev.key == ' '){
            if(this.autoMove){
                this.autoMove = false;   
                this.moveUp = false;
                this.moveDown = false; 
                this.moveLeft = false;
                this.moveRight = false;
                this.fire = false;
            }
            this.fire = true;
        }
    }.bind(this);

    this.keyHandlerUp = function(ev){
        //debug stuff
        ev = ev || window.event;
        // console.log(ev);

        
        if(ev.key == 'ArrowUp')
            this.moveUp = false;

        if(ev.key == 'ArrowDown')
            this.moveDown = false;

        if(ev.key == 'ArrowLeft')
            this.moveLeft = false;

        if(ev.key == 'ArrowRight')
            this.moveRight = false;
        
        if(ev.key == ' ')
            this.fire = false;

    }.bind(this);

    window.addEventListener("keydown", this.keyHandlerDown, false);
    window.addEventListener("keyup", this.keyHandlerUp, false);
}

AzShip.prototype.removeKeyHandlers = function(){
    this.keyHandler = window.removeEventListener("keydown",this.keyHandler, false);
    this.keyHandler = window.removeEventListener("keyup",this.keyHandler, false);    
}

AzProjectile = function(owner, stage, base){
    this.stage = stage;
    this.base = base;
    this.owner = owner;

    var fx = Math.sin(owner.sprite.rotation);
    var fy = -1 * Math.cos(owner.sprite.rotation);

    this.sprite = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.sprite.x = owner.sprite.x + fx * 10;
    this.sprite.y = owner.sprite.y + fy * 10;
    this.sprite.anchor.set(0.5,0,5);
    this.sprite.height = 10;
    this.sprite.width = 10;
    this.sprite.vx = fx * 10 + owner.sprite.vx;
    this.sprite.vy = fy * 10 + owner.sprite.vy;
    this.sprite.ax = 0;
    this.sprite.ay = 0;

    this.homing = false;
    this.lifeSpan = 50;  
    
    this.stage.addChild(this.sprite);

    this.destroyed = false;
}

AzProjectile.prototype.update = function(dt){
    
    //if homing add velocity towards target
    
    //move sprite
    this.sprite.vx += this.sprite.ax * dt;
    this.sprite.vy += this.sprite.ay * dt;
    this.sprite.x += this.sprite.vx * dt;
    this.sprite.y += this.sprite.vy * dt;

    //check for collisions
    var hit = false;
    if(this.base.objects.length > 0){
        b.hit(
                this.sprite,
                this.base.objects.map((e)=>{return e.sprite;}),
                false, false, false,

                //handle collision
                function(c,s){
                    hit = true;
                    s.tint = randomColor(128,255,128,255,128,255);
                    s.base.hp -= 1;
                }.bind(this));
    }
    
    spriteWrap(this.sprite);
    //check if off the stage or hit
    this.lifeSpan -= dt;
    if(this.lifeSpan < 0 || hit)
        this.destroy();    
}

AzProjectile.prototype.destroy = function(){
    this.destroyed = true;
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}

AzRock = function(x, y, size, stage, base, originator){
    this.base = base;
    this.stage = stage;
    this.size = size;

    this.sprite = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);
    this.sprite.base = this;
    this.destroyed = false;
    
    var dir = Math.random() * 2 * Math.PI;

    switch(size){
        case 1:
            var speed = Math.random() * 3 + 1;
            this.sprite.height = 100;
            this.sprite.width = 100;
            this.hp = 5;    
            break;
        case 2:
            var speed = Math.random() * 5 + 1;
            this.sprite.height = 50;
            this.sprite.width = 50;
            this.hp = 3;
            break;
        case 3:
            var speed = Math.random() * 7 + 1;
            this.sprite.height = 25;
            this.sprite.width = 25;
            this.hp = 1;
            break;
        default:
            var speed = Math.random() * 3 + 1;
            this.sprite.height = 10;
            this.sprite.width = 10;
            this.hp = 1;
            break;
    }
    
    var fx = Math.sin(dir);
    var fy = -1 * Math.cos(dir) ;

    this.sprite.vx = fx * speed;
    this.sprite.vy = fy * speed;
    this.sprite.ax = 0;
    this.sprite.ay = 0;

    this.stage.addChild(this.sprite);
}

AzRock.prototype.update = function(dt){
    //move sprite
    this.sprite.vx += this.sprite.ax * dt;
    this.sprite.vy += this.sprite.ay * dt;
    this.sprite.x += this.sprite.vx * dt;
    this.sprite.y += this.sprite.vy * dt;
    spriteWrap(this.sprite);

    if(this.hp <= 0)
        this.explode();
}

AzRock.prototype.destroy = function(){
    this.stage.removeChild(this);
    this.sprite.destroy();
    this.destroyed = true;
}

AzRock.prototype.explode = function(){
    //console.log(this.size, this.sprite.x, this.sprite.y)
    if(this.size == 1 || this.size == 2){
        for(var i = 0; i < Math.random() * 3 + 1; i++)
            this.base.objects.push(new AzRock(this.sprite.x, this.sprite.y, this.size + 1, 
                    this.stage, this.base, this));
    }

    this.base.particles.push(new AzParticle(this.sprite.x,this.sprite.y,
        this.base.particleContainer,this.sprite.tint));
    this.destroy();
}

AzParticle = function(x,y,stage,tint){
    this.container = new PIXI.Container();
    this.sprites = [];
    this.tex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    this.stage = stage;
    this.timer = 1000;
    this.startTimer = 1000;
    this.destroyed = false;

    for(var i = 0; i<20;i++){
        var s = new PIXI.Sprite(this.tex);
        s.x = x;
        s.y = y;
        s.vx = Math.sin(Math.random()*Math.PI*2) * Math.random() * 20;
        s.vy = Math.cos(Math.random()*Math.PI*2) * Math.random() * 20;
        s.ay = 0;
        s.ax = 0;
        s.drag = .98;
        s.anchor.set(0.5,0.5);
        s.scale.x = 1;
        s.scale.y = 1;
        s.width = Math.random() * 5 + 1;
        s.height = s.width;
        s.startWidth = s.width;
        s.bigTimer = 0;
        s.tint = tint;
        s.baseColor = tint;
        if(Math.random()<.2)
            s.blink = true;
        this.container.addChild(s);
        this.sprites[i] = s;
    }

    stage.addChild(this.container);
}

AzParticle.prototype.update = function(dt){
    if(this.timer > 0){
        this.sprites.forEach((e)=>{
            e.vy += e.ay * dt;
            e.vx += e.ax * dt;
            e.vy *= e.drag;
            e.vx *= e.drag;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.alpha = this.timer/this.startTimer;
            spriteWrap(e);

            if(e.bigTimer > 0){
                e.width = e.startWidth * (1 + .5 * e.bigTimer/20);
                e.height = e.startWidth * (1 + .5 * e.bigTimer/20);
                e.bigTimer -= dt;
                e.alpha = Math.min(2 * e.alpha, 1);
            }
            else{
                e.bigTimer = 0;
                e.width = e.startWidth;
                e.height = e.startWidth;
                e.tint = e.baseColor;
            }
        });

        this.timer -= dt;
        if(this.timer <= 0){
            this.destroy();
            console.log('done with dp');
        }
    }
}

AzParticle.prototype.destroy = function(dt){
    this.stage.removeChild(this.container);
    this.container.destroy({children:true});
    this.destroyed = true;
}