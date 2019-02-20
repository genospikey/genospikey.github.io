// Button class
// this creates a button and down and up thingies - i could add more crap but i wont for now!
// proper documentation later

//constructor
Button = function(x, y, width, height, buttonTex, buttonTexPressed){
    this.sprite = new PIXI.Sprite(buttonTex);
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.buttonTex = buttonTex;
    this.buttonTexPressed = buttonTexPressed;

    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.width = width;
    this.sprite.height = height;

    this._onDownFunctions = [];
    this._onUpFunctions = [];

    this._onDownMaster = function(){
        this._onDownFunctions.forEach((e)=>e());
        this.sprite.texture = buttonTexPressed;
    };

    this._onUpMaster = function(){
        this._onUpFunctions.forEach((e)=>e());
        this.sprite.texture = buttonTex;
    };

    this.sprite
        .on('pointerdown',this._onDownMaster.bind(this))
        .on('pointerup',this._onUpMaster.bind(this))
        .on('pointerupoutside',this._onUpMaster.bind(this))

    app.stage.addChild(this.sprite);
    return this;
}

Button.prototype.addEvent = function(f){
    this._onDownFunctions.push(f);
}

Button.prototype.twoButtonMode = function(buttonTexAlt, buttonTexPressedAlt){
    
    //setup buttons
    this.altButton = false;
    this.buttonTexAlt = buttonTexAlt;
    this.buttonTexPressedAlt = buttonTexPressedAlt;

    console.log(this.sprite);

    //remove existing event handlers
    this.sprite.removeAllListeners();
    
    //update event handlers
    this._onDownMaster = function(){
        this._onDownFunctions.forEach((e)=>e());

        if(this.altButton)
            this.sprite.texture = this.buttonTexPressedAlt;
        else
            this.sprite.texture = this.buttonTexPressed;
    };
    
    this._onUpMaster = function(){
        this._onUpFunctions.forEach((e)=>e());
        
        this.altButton = !this.altButton;
        if(this.altButton)
            this.sprite.texture = this.buttonTexAlt;
        else
            this.sprite.texture = this.buttonTex;
            
    };

    this.sprite
    .on('pointerdown',this._onDownMaster.bind(this))
    .on('pointerup',this._onUpMaster.bind(this))
    .on('pointerupoutside',this._onUpMaster.bind(this))

    console.log(this.sprite);
}