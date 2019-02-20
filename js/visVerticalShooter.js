VisualizerVShooter = function(audioInfo){
    this.name = 'Fried Green Tomatoes';
    // setup envronment variables
    this.audioInfo = audioInfo;

    //setup visualizer variables
    this.container = new PIXI.Container();
    this.container.width = WindowWidth;
    this.container.height = WindowHeight;
};

//create assets required when stage is created
VisualizerVShooter.prototype.start = function(stage){
    //app.renderer.backgroundColor = 0x1E2557;
   
    //create waveform sprite
    this.stage = stage;
    this.enemySpawnTimer = 10;
    this.score = 0;
    this.nextLevel = 1000;

    this.scoreUI = new PIXI.Text();
    this.scoreUI.style = {
        fill: '#DCDD5E',
        font: '50px',
        fontFamily: 'VT323, monospace'
    };
    this.scoreUI.anchor.set(0.5,0.5);
    this.scoreUI.x = WindowWidth/2;
    this.scoreUI.y = WindowHeight - 50;
    this.scoreUI.text = '0000000000'

    buttonContainer.addChild(this.scoreUI);

    //create background
    this.bg = new ParallaxGround(
        [new PIXI.Texture.fromImage('images/hill1.png')]
        ,4,this.stage);

    //create containers for objects (make one thing?)
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    this.changeColors();

    //create player
    this.player = new Ship(WindowWidth/2,3*WindowHeight/4,32,32,this.stage,this);

    // update platform handlers
    this.eventHandlers = [];
    for(var x = 0; x<this.audioInfo.numSlices; x++){
    
        var callback = function(index){
            this.enemies.forEach((e)=>{
                if(e.audioInfoEvent == index && e.moveFastTimer < 1)
                    e.moveFastTimer += 5;
            });
        };
        
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

   helpText.text = 'Destroy the invaders\n\nPress Arrow keys to move and\n\nspace to shoot!';
}

//stop visualizer functions that dont stop when events are stopped
VisualizerVShooter.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerVShooter.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    
    //destroy all assets
    this.container.destroy({children:true, texture:true, baseTexture:true});
    this.player.destroy();
    this.bg.destroy();
    this.projectiles.forEach((e)=>{e.destroy();});
    this.enemies.forEach((e)=>{e.destroy();});
    this.particles.forEach((e)=>{e.destroy();});
    buttonContainer.removeChild(this.scoreUI);
    this.scoreUI.destroy();
}

//resize all required elements when the window resizes
VisualizerVShooter.prototype.resize = function(){

}

//update the waveform information
VisualizerVShooter.prototype.update = function(dt){

    this.enemySpawnTimer = Math.max(this.enemySpawnTimer - dt,0);
    if(this.enemySpawnTimer <= 0 && this.player.state == 'playing'){
        //spawn one enemy for now
        switch(Math.floor(Math.random()*3)){
            case 0:
                var numShips = Math.floor(Math.random() * 2 + 2);
                for(var i = 0; i < numShips; i++)
                    this.enemies.push(new Enemy(
                            new PIXI.Texture.fromImage('images/whiteSquare.png'),
                            WindowWidth/6 + (WindowWidth-WindowWidth/3)/(numShips-1) * i,-50,this.stage,this,
                            0));
                this.enemySpawnTimer += 100 + Math.random() * 100;
                break;
            case 1:
                var numShips = 10;
                var enemyType = Math.floor(Math.random()*2);
                for(var i = 0; i < numShips; i++)
                    this.enemies.push(new Enemy(
                            new PIXI.Texture.fromImage('images/whiteSquare.png'),
                            WindowWidth/6 + (WindowWidth-WindowWidth/3)/(numShips-1) * i,-50,this.stage,this,
                            1));
                this.enemySpawnTimer += 200 + Math.random() * 100;
                break;
            case 2:
                var numShips = Math.floor(Math.random() * 2 + 2);
                for(var i = 0; i < numShips; i++)
                    this.enemies.push(new Enemy(
                            new PIXI.Texture.fromImage('images/whiteSquare.png'),
                            WindowWidth/6 + (WindowWidth-WindowWidth/3)/(numShips-1) * i,-50,this.stage,this,
                            2));
                this.enemySpawnTimer += 200 + Math.random() * 100;
                break;
        }

    }

    this.player.update(dt);
    this.bg.update(dt);

    this.projectiles.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
            this.projectiles.splice(i,1);
    });

    this.enemies.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
            this.enemies.splice(i,1);
    });

    this.particles.forEach((e,i)=>{
        e.update(dt);
        if(e.destroyed == true)
            this.particles.splice(i,1);
    });

    this.scoreUI.text = (this.score+'').padStart(10,'0');
    if(this.nextLevel < this.score){
        this.changeColors();
        this.nextLevel += 1000;
    }
}

VisualizerVShooter.prototype.changeColors = function(){
    app.renderer.backgroundColor = randomColor(0,32,0,32,0,32);
    this.bg.colorBase = randomColor(64,192,64,192,64,192);
    this.enemyColors = [];
    for(var x = 0; x < 5; x++){
        var t = 384;
        var r = Math.round(Math.random() * 255);
        t -= r;
        var g = Math.min(Math.round(Math.random() * 255), 255 - t);
        t -= g;
        var b = t;
        this.enemyColors[x] = (r << 16) + (g << 8) + b;
    }

}

//JumpMan - interactive character for visualizer
Ship = function(x,y,width,height,stage,base){
    this.state = 'idle';
    this.score = 0;
    this.stage = stage;
    this.base = base;

    // console.log(this.idleTex);
    //sprite info
    this.startX = x;
    this.startY = y;
    this.sprite = new PIXI.Sprite.fromImage('images/ship.png');
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0.5);
    
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.ax = 0;
    this.sprite.ay = 0;

    this.sprite.scale.x = 1;
    this.sprite.scale.y = 1;
    this.sprite.width = width;
    this.sprite.height = height;

    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.fire = false;
    this.fireCooldown = 0;
    this.fireSpeed = -25;

    this.speed = 5;
    this.maxSpeed = 7;
    this.drag = 1;

    this.state = 'playing';
    this.autoMove = true;
    this.destroyed = false;
    this.addKeyHandlers();
    this.explode = false;

    stage.addChild(this.sprite);
}

Ship.prototype.update = function(dt){
    
    if(this.explode){
        this.state = 'dead';
        this.base.particles.push(new DeathParticle2(
            this.sprite.x,this.sprite.y,this.stage,this.sprite.tint));

        this.base.particles.push(new DeathParticle2(
            this.sprite.x,this.sprite.y,this.stage,this.sprite.tint));
        
        this.base.particles.push(new DeathParticle2(
            this.sprite.x,this.sprite.y,this.stage,this.sprite.tint));
        
        this.explode = false;
        this.sprite.alpha = 0;
        this.deadTimer = 300;
        this.alphaTimer = 50;
        this.sprite.x = this.startX;
        this.sprite.y = this.startY;

        this.base.enemies.forEach((e)=>{
            console.log(e);
            e.explode = true;
        });
        
        this.base.changeColors();
        this.base.score = 0;
    }

    if(this.state == 'dead'){
        
        this.deadTimer = Math.max(this.deadTimer - dt,0)
        this.alphaTimer = Math.max(this.alphaTimer - dt, 0)
        this.base.score = 0;

        if(this.alphaTimer == 0){
            this.alphaTimer = 50;
            if(this.sprite.alpha == 0)
                this.sprite.alpha = .5
            else
                this.sprite.alpha = 0;
        }

        if(this.deadTimer == 0){
            this.state = 'playing';
            this.sprite.alpha = 1;
            this.autoMove = true;
        }
    }

    //get update
    if(this.state == 'playing'){
        if(this.autoMove)
            this.determineInputs();

        this.sprite.ay = 0;
        if(this.moveUp)
            this.sprite.ay -= this.speed;

        if(this.moveDown)
            this.sprite.ay += this.speed;

        this.sprite.ax = 0;
        if(this.moveLeft)
            this.sprite.ax -= this.speed;

        if(this.moveRight)
            this.sprite.ax += this.speed;

        //update location and velocty
        this.sprite.vx += this.sprite.ax * dt - Math.sign(this.sprite.vx) * this.drag * dt;
        this.sprite.vy += this.sprite.ay * dt - Math.sign(this.sprite.vy) * this.drag * dt;

        if(Math.abs(this.sprite.vx) < this.speed/10 && (!this.moveUp && !this.moveDown))
            this.sprite.vx = 0;

        if(Math.abs(this.sprite.vy) < this.speed/10 && (!this.moveRight && !this.moveLeft))
            this.sprite.vy = 0;
        
        if(Math.abs(this.sprite.vx) > this.maxSpeed)
            this.sprite.vx = Math.sign(this.sprite.vx) * this.maxSpeed;

        if(Math.abs(this.sprite.vy) > this.maxSpeed)
            this.sprite.vy = Math.sign(this.sprite.vy) * this.maxSpeed;
        

        this.sprite.x += this.sprite.vx * dt;
        this.sprite.y += this.sprite.vy * dt;

        //confine to screen
        if((this.sprite.x - this.sprite.width/2)< 0){
            this.sprite.x = this.sprite.width/2;
            this.sprite.vx = 0;
        }

        if((this.sprite.x + this.sprite.width/2)> WindowWidth){
            this.sprite.x = WindowWidth - this.sprite.width/2;
            this.sprite.vx = 0;
        }

        if((this.sprite.y - this.sprite.height/2)< 0){
            this.sprite.y = this.sprite.height/2;
            this.sprite.vy = 0;
        }
        
        if((this.sprite.y + this.sprite.height/2)> WindowHeight){
            this.sprite.y = WindowHeight - this.sprite.height/2;
            this.sprite.vy = 0;
        }

        //fire projectiles if holding space
        this.fireCooldown = Math.max(this.fireCooldown - dt,0)
        if(this.fireCooldown <= 0 && this.fire){
            this.fireCooldown = 5;
            console.log('fire!');
            this.base.projectiles.push(new Projectile(
                new PIXI.Texture.fromImage('images/whiteSquare.png'),
                this.sprite.x,this.sprite.y-20,10,25,0,this.fireSpeed,this.stage,this.base,'player'));
        }

        //check for hits after moving
        if(this.base.enemies.length > 0){
            var hit = false;
            b.hit(this.sprite,this.base.enemies.map((e)=>{return e.sprite;}),
                    false,false,false,
                    function(c,s){
                        hit = true;
                        console.log(this);
                    }.bind(this));
            if(hit)
                this.explode = true;
        }
    }
}

Ship.prototype.destroy = function(){
    this.stage.removeChild(this.sprite);
    this.removeKeyHandlers();
    this.sprite.destroy(true);
}

Ship.prototype.addKeyHandlers = function(){
    
    this.keyHandlerDown = function(ev){
        //debug stuff
        ev = ev || window.event;
        // console.log(ev);
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

Ship.prototype.removeKeyHandlers = function(){
    window.removeEventListener("keydown",this.keyHandlerDown, false);
    window.removeEventListener("keyup",this.keyHandlerUp, false);    
}

Ship.prototype.resize = function(x,y){
    this.startX = x;
    this.startY = y;  
}

Ship.prototype.determineInputs = function(){

    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.fire = false;

    //look for nearby hazards and fly away
    var nearest = {};
    if(this.base.enemies.length>0){
        nearest = this.base.enemies[0];
        this.base.enemies.forEach((e)=>{
            if(Math.hypot(this.sprite.x - e.sprite.x, this.sprite.y-e.sprite.y)<
               Math.hypot(this.sprite.x - nearest.sprite.x, this.sprite.y-nearest.sprite.y))
                nearest = e;
        });

        if(nearest.sprite.x > this.sprite.x && 
                Math.abs(this.sprite.x-nearest.sprite.x)>10){
            this.moveRight = true;
        }
        if(nearest.sprite.x < this.sprite.x &&
                Math.abs(this.sprite.x-nearest.sprite.x)>10){
            this.moveLeft = true;
        }

    }

    if(this.sprite.y > this.startY){
        this.moveUp = true;
        this.moveDown = false;
    }

    if(this.sprite.y < this.startY-50){
        this.moveDown = true;
        this.moveUp = false;
    }

    this.base.projectiles.forEach((e)=>{
        //check distance
        var d = Math.hypot(this.sprite.x - e.sprite.x, 
                this.sprite.y-e.sprite.y);
        if(e.owner != 'player' && d < 100){
            //move away in the left or right direction
            if(this.sprite.x < e.sprite.x){
                this.moveRight = false;
                this.moveLeft = true;
            }
            else {
                this.moveLeft = false;
                this.moveRight = true;
            }
            if(this.sprite.y < e.sprite.y){
                this.moveUp = true;
                this.moveDown = false;
            }
            else {
                this.moveUp = false;
                this.moveDown = true;
            }
        }
    });

    this.base.enemies.forEach((e)=>{
        //check distance
        var d = Math.hypot(this.sprite.x - e.sprite.x, 
                this.sprite.y-e.sprite.y);
        if(d < 100){
            //move away in the left or right direction
            if(this.sprite.x < e.sprite.x){
                this.moveRight = false;
                this.moveLeft = true;
            }
            else {
                this.moveLeft = false;
                this.moveRight = true;
            }
            if(this.sprite.y < e.sprite.y){
                this.moveUp = true;
                this.moveDown = false;
            }
            else {
                this.moveUp = false;
                this.moveDown = true;
            }
        }
    });

    //shoot always!
    if(this.base.enemies.length > 0 && nearest.sprite.y > 50){
        this.fire = true;
    }
}

//ParallaxBG - setup parallax scrolling bg
ParallaxGround = function(tex, numLayers, stage){
    this.textures = tex;
    this.numLayers = numLayers;
    this.stage = stage;
    this.speed = 2;
    //this.colorBase = 0x5F9547;
    this.colorBase = randomColor(64,192,64,192,64,192);

    
    //generate layers
    this.layers = new Array(this.numLayers);
    this.spritesLeft = new Array(this.numLayers);
    this.spritesRight = new Array(this.numLayers);

    for(var i = 0; i<this.numLayers; i++){
        
        this.layers[i] = new PIXI.Container();

        var y = 0;
        var j = 0;
        var sprites = [];


        //make stuff till the end
        while(y<WindowHeight){
            var width = 50 + Math.random() * 300;
            var height = 50 + i * 25;
            sprites[j] = new PIXI.Sprite(this.randomTexture());
            
            sprites[j].anchor.set(0,1);
            sprites[j].x = 20 * i;
            sprites[j].y = y;
            sprites[j].scale.x = 1;
            sprites[j].scale.y = 1;
            sprites[j].width = width;
            sprites[j].height = height;
            sprites[j].rotation = Math.PI/2;

            var r = Math.round(((this.colorBase >> 16) & 255) * (this.numLayers - i) / this.numLayers);
            var g = Math.round(((this.colorBase >> 8) & 255) * (this.numLayers - i) / this.numLayers);
            var b = Math.round(((this.colorBase) & 255) * (this.numLayers - i) / this.numLayers);
            
            var color = (r << 16) + (g << 8) + b;

            sprites[j].tint = color;

            //add to screen
            this.layers[i].addChild(sprites[j]);
            
            //increment values
            y += sprites[j].width;
            j++;
        }

        this.spritesLeft[i] = sprites;

        var y = 0;
        var j = 0;
        var sprites = [];

        var colorBase = 0xFFFFFF;
        //make stuff till the end
        while(y<WindowHeight){
            var width = 50 + Math.random() * 300;
            var height = 50 + i * 25;
            sprites[j] = new PIXI.Sprite(this.randomTexture());
            
            sprites[j].anchor.set(1,1);
            sprites[j].x = WindowWidth - 20 * i;
            sprites[j].y = y;
            sprites[j].scale.x = 1;
            sprites[j].scale.y = 1;
            sprites[j].width = width;
            sprites[j].height = height;
            sprites[j].rotation = -Math.PI/2;

            var r = Math.round(((this.colorBase >> 16) & 255) * (this.numLayers - i) / this.numLayers);
            var g = Math.round(((this.colorBase >> 8) & 255) * (this.numLayers - i) / this.numLayers);
            var b = Math.round(((this.colorBase) & 255) * (this.numLayers - i) / this.numLayers);
            
            var color = (r << 16) + (g << 8) + b;

            sprites[j].tint = color;

            //add to screen
            this.layers[i].addChild(sprites[j]);
            
            //increment values
            y += sprites[j].width;
            j++;
        }   
        
        this.spritesRight[i] = sprites;
    }

    for(var i = this.layers.length - 1; i >= 0; i--){
        this.stage.addChild(this.layers[i]);
    }
}

ParallaxGround.prototype.update = function(dt){

    if(this.speed != 0){
        
        //move each layer an add and remove as necessary
        for(var i = 0; i<this.numLayers; i++){

            //figure out move distance
            var moveY = (this.speed + this.speed/5*(this.numLayers - i)*(this.numLayers - i)/this.numLayers) * dt;
            
            for(var j = 0; j < this.spritesLeft[i].length; j++){
                this.spritesLeft[i][j].y += moveY;
            }

            if(this.spritesLeft[i][this.spritesLeft[i].length-1].y > WindowHeight){
                this.layers[i].removeChild(this.spritesLeft[i][this.spritesLeft[i].length-1]);
                this.spritesLeft[i].pop();
            }

            if(this.spritesLeft[i][0].y > -50){
                //add a sprite
                // console.log('test');
                var width = 50 + Math.random() * 300;
                var height = 50 + i * 25;
                var sprite = new PIXI.Sprite(this.randomTexture());
                
                sprite.anchor.set(0,1);
                sprite.x = 20 * i;
                sprite.y = this.spritesLeft[i][0].y - width;
                sprite.scale.x = 1;
                sprite.scale.y = 1;
                sprite.width = width;
                sprite.height = height;
                sprite.rotation = Math.PI/2;
    
                var r = Math.round(((this.colorBase >> 16) & 255) * (this.numLayers - i) / this.numLayers);
                var g = Math.round(((this.colorBase >> 8) & 255) * (this.numLayers - i) / this.numLayers);
                var b = Math.round(((this.colorBase) & 255) * (this.numLayers - i) / this.numLayers);
                
                var color = (r << 16) + (g << 8) + b;
    
                sprite.tint = color;

                this.layers[i].addChild(sprite);
                this.spritesLeft[i].unshift(sprite);

            }

            for(var j = 0; j < this.spritesRight[i].length; j++){
                this.spritesRight[i][j].y += moveY;
            }

            if(this.spritesRight[i][this.spritesRight[i].length-1].y > WindowHeight){
                this.layers[i].removeChild(this.spritesRight[i][this.spritesRight[i].length-1]);
                this.spritesRight[i].pop();
            }

            if(this.spritesRight[i][0].y > -50){
                //add a sprite
                var width = 50 + Math.random() * 300;
                var height = 50 + i * 25;
                var sprite = new PIXI.Sprite(this.randomTexture());
                
                sprite.anchor.set(1,1);
                sprite.x = WindowWidth - 20 * i;
                sprite.y = this.spritesRight[i][0].y - width;
                sprite.scale.x = 1;
                sprite.scale.y = 1;
                sprite.width = width;
                sprite.height = height;
                sprite.rotation = -Math.PI/2;
    
                var r = Math.round(((this.colorBase >> 16) & 255) * (this.numLayers - i) / this.numLayers);
                var g = Math.round(((this.colorBase >> 8) & 255) * (this.numLayers - i) / this.numLayers);
                var b = Math.round(((this.colorBase) & 255) * (this.numLayers - i) / this.numLayers);
                
                var color = (r << 16) + (g << 8) + b;
    
                sprite.tint = color;

                this.layers[i].addChild(sprite);
                this.spritesRight[i].unshift(sprite);

            }
        }
    }
}

//get a random texture
ParallaxGround.prototype.randomTexture = function(){
    var i = Math.floor(Math.random()*this.textures.length);
    return this.textures[i];
}

ParallaxGround.prototype.resize = function(){
}

ParallaxGround.prototype.destroy = function(){
    this.layers.forEach((e)=>{
        this.stage.removeChild(e);
        e.destroy({children:true, texture:true, baseTexture:true});
    });
}


function randomColor(minR,maxR,minG,maxG,minB,maxB){
    var color = (Math.floor(Math.random()*(maxR-minR)+minR) << 16) + (Math.floor(Math.random()*(maxG-minG)+minG) << 8) + Math.floor(Math.random()*(maxB-minB)+minB);
    return color;
}

Projectile = function(tex,x,y,w,h,vx,vy,stage,base,owner){
    this.stage = stage;
    this.base = base;
    this.owner = owner;

    this.sprite = new PIXI.Sprite(tex);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0,5);
    this.sprite.height = h;
    this.sprite.width = w;
    this.sprite.vx = vx;
    this.sprite.vy = vy;
    this.sprite.ax = 0;
    this.sprite.ay = 0;

    this.homing = false;  
    
    this.stage.addChild(this.sprite);

    this.destroyed = false;
}

Projectile.prototype.update = function(dt){
    
    //if homing add velocity towards target
    
    //move sprite
    this.sprite.vx += this.sprite.ax * dt;
    this.sprite.vy += this.sprite.ay * dt;
    this.sprite.x += this.sprite.vx * dt;
    this.sprite.y += this.sprite.vy * dt;

    //check for collisions
    var hit = false;
    if(this.owner == 'player' && this.base.enemies.length > 0){
        b.hit(
                this.sprite,
                this.base.enemies.map((e)=>{return e.sprite;}),
                false, false, false,

                //handle collision
                function(c,s){
                    hit = true;
                    s.tint = randomColor(0,255,0,255,0,255);
                    if(--s.base.hp<=0)
                        s.base.explode = true;
                }.bind(this));
    }

    if(this.owner == 'enemy'){
        if(this.base.player.state == 'playing' &&
                b.hit(this.sprite,this.base.player.sprite)){
            this.base.player.explode = true;
        };
    }

    b.hit(this.sprite,this.base.projectiles.map((e)=>{return e.sprite;}));

    //check if off the stage or hit
    if(this.sprite.x < -100 || this.sprite.y < -100 || 
            this.sprite.x > WindowWidth + 100 || this.sprite.y > WindowHeight + 100 || hit)
        this.destroy();
}

Projectile.prototype.destroy = function(){
    this.destroyed = true;
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
}

Enemy = function(tex,x,y,stage,base,type){
    this.stage = stage;
    this.base = base;

    this.sprite = new PIXI.Sprite(tex);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor.set(0.5,0,5);
    this.sprite.height = 50;
    this.sprite.width = 50;
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.ax = 0;
    this.sprite.ay = 0;
    this.sprite.base = this;
    this.hp = 3;

    this.audioInfoEvent = Math.floor(audioInfo.numSlices * Math.random());
    this.moveFastTimer = 0;
    //movement types: 
    // 0 = straight down
    // 1 = back and forth
    // 2 = swoop down
    // 3 = track then down and up
    // 4 = circles
    // 5 = sin wave
    if(type) this.moveType = type;
    else this.moveType = Math.floor(Math.random()*1);

    this.state = '';
    this.score = 10;

    //change shape based on move type
    switch(this.moveType){
        case 0:
            this.sprite.height = 65;
            this.sprite.width = 65;
            this.hp = 5;
            this.audioInfoEvent = 0;
            this.score = 100;
            this.fireTimer = 0;
            break;
        case 1:
            this.sprite.height = 25;
            this.sprite.width = 50;
            this.hp = 3;
            this.audioInfoEvent = 2;
            this.state = 'left';
            this.nextRow = this.sprite.y;
            this.score = 10;
            break;
        case 2:
            this.sprite.height = 35;
            this.sprite.width = 50;
            this.state = 'forward';
            this.swoopTimer = 10;
            this.hp = 3;
            this.audioInfoEvent = 1;
            this.big = false;
            this.score = 50;
            break;
        case 3:
            this.sprite.height = 25;
            this.sprite.width = 50;
            break;
        case 4:
            this.sprite.height = 15;
            this.sprite.width = 15;
            break;
    }

    this.sprite.tint = this.base.enemyColors[this.moveType];

    this.stage.addChild(this.sprite);

    this.destroyed = false;
}

Enemy.prototype.update = function(dt){
    if(!this.destoyed){
        //do movement updates
        var vxM = 0;
        var vyM = 0;
        
        switch(this.moveType){
            
            //just go straight down
            case 0:
                
                if(this.moveFastTimer > 0)
                    vyM = 3;
                else
                    vyM = 1;
                
                this.sprite.vx += this.sprite.ax * dt;
                this.sprite.vy += this.sprite.ay * dt;
                this.sprite.x += this.sprite.vx * dt + vxM * dt;
                this.sprite.y += this.sprite.vy * dt + vyM * dt;

                this.fireTimer = Math.max(this.fireTimer - dt,0);
                if(this.moveFastTimer > 0 && this.fireTimer == 0){
                    //fire
                    console.log('fire at will');
                    this.fireTimer = 150;
                    var x = this.base.player.sprite.x - this.sprite.x;
                    var y = this.base.player.sprite.y - this.sprite.y;

                    this.base.projectiles.push(new Projectile(
                        new PIXI.Texture.fromImage('images/whiteSquare.png'),
                        this.sprite.x,this.sprite.y,10,10,
                        x/(Math.abs(x)+Math.abs(y))*5, y/(Math.abs(x)+Math.abs(y))*5,
                        this.stage,this.base,'enemy'));
                }
                
                break;
            
            //move back and forth
            case 1:
                
                if(this.moveFastTimer > 0)
                    var v = 6;
                else
                    var v = 3;
                
                switch(this.state){
                    case 'leftdown':
                        vyM = v;
                        break;
                    case 'rightdown':
                        vyM = v;
                        break;
                    case 'left':
                        vxM = -v;
                        break;
                    case 'right':
                        vxM = v;
                        break;
                    default:
                        break;
                }

                this.sprite.vx += this.sprite.ax * dt;
                this.sprite.vy += this.sprite.ay * dt;
                this.sprite.x += this.sprite.vx * dt + vxM * dt;
                this.sprite.y += this.sprite.vy * dt + vyM * dt;

                //check for the edges here
                if(this.state == 'leftdown' && this.sprite.y >= this.nextRow){
                    this.state = 'right';
                    var x = this.sprite.y - this.nextRow;
                    this.sprite.y = this.nextRow;
                    this.sprite.x += x;
                }

                if(this.state == 'rightdown' && this.sprite.y >= this.nextRow){
                    this.state = 'left';
                    var x = this.sprite.y - this.nextRow;
                    this.sprite.y = this.nextRow;
                    this.sprite.x -= x;
                }

                if(this.state == 'left' && this.sprite.x <= WindowWidth/10){
                    this.state = 'leftdown';
                    this.nextRow = this.sprite.y + 100;
                    var y = WindowWidth/10 - this.sprite.x;
                    this.sprite.x = WindowWidth/10;
                    this.sprite.y += y;
                }

                if(this.state == 'right' && this.sprite.x >= WindowWidth - WindowWidth/10){
                    this.state = 'rightdown';
                    this.nextRow = this.sprite.y + 100;
                    var y = this.sprite.x - (WindowWidth - WindowWidth/10);
                    this.sprite.x = (WindowWidth - WindowWidth/10);
                    this.sprite.y += y;
                }

                break;
                
            //2 - swooper! goes down in an arc back and forth
            case 2:
                if(this.state == 'stop')
                    this.swoopTimer = Math.max(this.swoopTimer - dt,0);
                
                if(this.state == 'swoop')
                    this.swoopTimer += dt;

                switch(this.state){
                    //move to the top of the screen
                    case 'forward':
                        vyM = 1;
                        break;

                    //parabolic motion for swooping
                    case 'swoop':
                        var swoopTime = 350;
                        vyM = this.swoopY/(swoopTime/(Math.PI * 2)) * Math.cos(Math.PI * 2 * this.swoopTimer/swoopTime);
                        vxM = this.swoopX/(swoopTime/4);
                }

                this.sprite.vx += this.sprite.ax * dt;
                this.sprite.vy += this.sprite.ay * dt;
                this.sprite.x += this.sprite.vx * dt + vxM * dt;
                this.sprite.y += this.sprite.vy * dt + vyM * dt;

                if(this.state=='forward' && this.sprite.y > 100){
                    this.sprite.y = 100;
                    this.state = 'stop';
                }

                if(this.state=='swoop' && this.sprite.y < 100){
                    this.swoopTimer = 100;
                    this.state = 'stop';
                    this.sprite.y = 100;
                }

                if(this.state=='stop' && this.swoopTimer <= 0){
                    this.target = this.base.player;
                    this.swoopX = this.target.sprite.x - this.sprite.x;
                    this.swoopY = this.target.sprite.y - this.sprite.y;
                    this.state = 'swoop';
                    this.swoopTimer = 0;
                }

                if(this.moveFastTimer > 0 && !this.big){
                    this.big = true;
                    this.sprite.width = 60;
                    this.sprite.height = 45;
                }

                if(this.moveFastTimer <= 0 && this.big){
                    this.big = false;
                    this.sprite.width = 50;
                    this.sprite.height = 35;
                }

                break;

            //default to straight down
            default:
                vyM = 1;
                this.sprite.vx += this.sprite.ax * dt;
                this.sprite.vy += this.sprite.ay * dt;
                this.sprite.x += this.sprite.vx * dt + vxM * dt;
                this.sprite.y += this.sprite.vy * dt + vyM * dt;
                break;
        }

        this.moveFastTimer = Math.max(this.moveFastTimer - dt,0);
        //move sprite

        if(this.sprite.x < -100 || this.sprite.y < -100 || 
                this.sprite.x > WindowWidth + 100 || this.sprite.y > WindowHeight + 100)
            this.destroy();
    }
    if(this.explode){
        //create particles
        this.base.particles.push(new DeathParticle2(
                this.sprite.x,this.sprite.y,this.stage,this.sprite.tint));
        
        //update score
        this.base.score += this.score;

        //blow up
        this.destroy();
    }
};


Enemy.prototype.destroy = function(){
    this.destroyed = true;
    this.stage.removeChild(this.sprite);
    this.sprite.destroy();
};

DeathParticle2 = function(x,y,stage,tint){
    this.container = new PIXI.Container();
    this.sprites = [];
    this.tex = new PIXI.Texture.fromImage('images/whiteSquare.png');
    this.stage = stage;
    this.timer = 50;
    this.destroyed = false;

    for(var i = 0; i<20;i++){
        var s = new PIXI.Sprite(this.tex);
        s.x = x;
        s.y = y;
        s.vx = Math.sin(Math.random()*Math.PI*2) * Math.random() * 20;
        s.vy = Math.cos(Math.random()*Math.PI*2) * Math.random() * 20;
        s.ay = 0;
        s.anchor.set(0.5,0.5);
        s.scale.x = 1;
        s.scale.y = 1;
        s.width = 10;
        s.height = 10;
        s.tint = tint;
        this.container.addChild(s);
        this.sprites[i] = s;
    }

    stage.addChild(this.container);
}

DeathParticle2.prototype.update = function(dt){
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

DeathParticle2.prototype.destroy = function(dt){
    this.stage.removeChild(this.container);
    this.container.destroy({children:true});
    this.destroyed = true;
}