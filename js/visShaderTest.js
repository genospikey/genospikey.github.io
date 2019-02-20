VisualizerShaderTest = function(audioInfo){
    this.name = 'Shad Casper Rhyme Time';

    // setup envronment variables
    this.audioInfo = audioInfo;

    this.container = new PIXI.Container();
    this.container.width = Math.max(WindowWidth,WindowHeight) * 1.8;
    this.container.height = Math.max(WindowWidth,WindowHeight) * 1.8;


};

//create assets required when stage is created
VisualizerShaderTest.prototype.start = function(stage){
    app.renderer.backgroundColor = 0x000000;
    //create waveform sprite
    this.stage = stage;
    this.stage.addChild(this.container);

    this.sprite = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.sprite.width = 100;
    this.sprite.height = 100;
    this.sprite.x = WindowWidth/2;
    this.sprite.y = WindowHeight/2;
    this.sprite.anchor.set(0.5,0.5);
    this.container.addChild(this.sprite);

    this.prevFrame = new PIXI.Sprite.fromImage('images/whiteSquare.png');
    this.prevFrame.anchor.set(0.5,0.5);
    this.prevFrame.x = WindowWidth/1.5;
    this.prevFrame.y = WindowHeight/1.5;
    this.prevFrame.width = Math.max(WindowWidth,WindowHeight) * 1.8;
    this.prevFrame.height = Math.max(WindowWidth,WindowHeight) * 1.8;
    this.container.addChild(this.prevFrame);

    console.log(app.renderer.generateTexture(this.container));
    this.prevFrame.texture = app.renderer.generateTexture(this.container);


    helpText.text = 'Shaders will be here eventually\n'
                + '- thank you for your patience!\n';
}

VisualizerShaderTest.prototype.shaderLoaded = function(){

    //add update function after shader is loaded
    this.updateHandler = this.audioInfo.addUpdateEvent((dt)=>{
        this.update(dt);
    });
}
//stop visualizer functions that dont stop when events are stopped
VisualizerShaderTest.prototype.stop = function(){

}

//destroy all things related to the visualizer
VisualizerShaderTest.prototype.destroy = function(){

    //stop update functions
    this.audioInfo.removeUpdateEvent(this.updateHandler);
    
    this.stage.removeChild(this.container);
    this.container.destroy({children:true, texture:true, baseTexture:true});
}

//resize all required elements when the window resizes
VisualizerShaderTest.prototype.resize = function(){
    

}

//update the waveform information
VisualizerShaderTest.prototype.update = function(dt){

    this.prevFrame.texture = app.renderer.generateTexture(this.container);
}





/*
    var url = "/js/shader/test.glsl";
    console.log(url);

    var vertFile = new XMLHttpRequest();
    vertFile.open("GET",url,true);
    vertFile.send();

 
    //response function
    
    vertFile.onreadystatechange = function() {
        if (vertFile.readyState== 4 && vertFile.status == 200) {
           this.shaderCode = vertFile.responseText.split('\n').reduce( (c, a) => c + a.trim() + '\n');
           console.log(this.shaderCode);
           this.shaderLoaded();
        }
     }.bind(this)*/