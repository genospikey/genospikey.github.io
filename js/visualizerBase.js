window.onload = function(){
	// Get Browser Info
	WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
    WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;
    
    //create application
    app = new PIXI.Application(WindowWidth,WindowHeight,{backgroundColor: 0x880088});
    
    //testing redraw
    //app.renderer.preserveDrawingBuffer = true;
    
    stage = app.stage;
    b = new Bump(PIXI);
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    canvas = document.body.appendChild(app.view);

    //setup groups
    visGroup = new PIXI.display.Group(0,true);
    app.stage.addChild(new PIXI.display.Layer(visGroup));
    visContainer = new PIXI.Container();
    visContainer.parentGroup = visGroup;
    app.stage.addChild(visContainer);

    buttonGroup = new PIXI.display.Group(100,true);
    app.stage.addChild(new PIXI.display.Layer(buttonGroup));
    buttonContainer = new PIXI.Container();
    buttonContainer.parentGroup = buttonGroup;
    app.stage.addChild(buttonContainer);

    //setup loader and add manifest
    loader = app.loader;
    loader.add('images/whiteSquare.png');
    loader.add('js/json/visualizerList.json');
    loader.on('complete', loadVisualizers);
    loader.load();

    function loadVisualizers(){
        console.log('loaded');
        visualizerList = loader.resources['js/json/visualizerList.json'].data.VisualizerList;
        visualizerList.forEach(e=>{
            e.loaded = false;
            e.script = document.createElement('script');
            e.script.onload = loadVisComplete.bind(this,e);
            e.script.src = e.file;
            document.head.appendChild(e.script);
        });
    }

    function loadVisComplete(v){
        // figure out which one came back and set it to true
        // theres got to be an easier way to do this one, but its not like im going to be loading 1000s of scripts
        // put it into the callback function somehow?
        // console.log(ev);
        v.loaded = true;
        console.log(v);

        //check that all scripts have loaded before drawing stuff
        var allLoaded = true;
       
        visualizerList.forEach((e)=>{
            if(e.loaded == false) allLoaded = false;
            console.log(e,e.loaded);
        });

        if(allLoaded) startApp();
    };

    function startApp() {
        //load visualizers    


        //setup Audio source
        audio = new Audio('http://ice1.somafm.com/groovesalad-128-mp3');
        audio.crossOrigin = "anonymous";
        audio.muted = true;

        visualizerList = loader.resources['js/json/visualizerList.json'].data.VisualizerList;

        //Add UI elements
        trackUI = new PIXI.Text();
        trackUI.style = {
            fill: '#2C2D0E',
            font: '30px',
            fontFamily: 'VT323, monospace'
        };

        VisUI = new PIXI.Text();
        VisUI.style = {
            fill: '#2C2D0E',
            font: '30px',
            fontFamily: 'VT323, monospace'
        };


        buttonContainer.addChild(trackUI);
        buttonContainer.addChild(VisUI);

        //add event to start getting info when audio source loads
        audioInfoLoaded = false;
        audio.addEventListener('canplaythrough', function() {
            if(audioInfoLoaded == false){
                //create audio info object
                audioInfo = new AudioInfo(audio);

                //i think you can figure this one out
                createButtons();
                
                //add visualizer
                visualizerIndex = 0;
                visualizer = new window[visualizerList[visualizerIndex].className](audioInfo);
                visualizer.start(visContainer);

                drawUIText();

                audioInfoLoaded = true;
            }
        });
    }
}

window.addEventListener("resize", function() {
    WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
	WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;
    app.renderer.resize(WindowWidth , WindowHeight);

    if(visualizer) visualizer.resize();
    drawUIText();
});

function createButtons(){
        //create pause button
        pauseButton = new Button(20,20,45,45,new PIXI.Texture.fromImage('images/buttonPlayUp.png'),
            new PIXI.Texture.fromImage('images/buttonPlayDown.png'));

        pauseButton.addEvent(function(){

            //resume capture if suspended
            if (audioInfo.audioCtx.state === 'suspended') {
                audioInfo.audioCtx.resume();
            }

            //unmute if muted
            audio.muted = !audio.muted;
            if(audio.muted==false){
                console.log(this);
                
                var p = audio.play();
                if(p != undefined){
                    p.then(function(){
                        var t = this.buttonTex;
                        this.buttonTex = this.buttonTexPressed;
                        this.buttonTexPressed = t;
                        this.sprite.texture = this.buttonTex;
                    }.bind(pauseButton));
                }
            }
            else{
                var t = this.buttonTex;
                this.buttonTex = this.buttonTexPressed;
                this.buttonTexPressed = t;
                this.sprite.texture = this.buttonTex;
            }
        }.bind(pauseButton)); 

        volUpButton = new Button(70,20,45,45,new PIXI.Texture.fromImage('images/buttonUpUp.png'),
        new PIXI.Texture.fromImage('images/buttonUpDown.png'));

        volUpButton.addEvent(function(){
            audio.volume = Math.min(audio.volume + .1,1);
        }); 

        volDownButton = new Button(120,20,45,45,new PIXI.Texture.fromImage('images/buttonDownUp.png'),
        new PIXI.Texture.fromImage('images/buttonDownDown.png'));

        volDownButton.addEvent(function(){
            audio.volume = Math.max(audio.volume - .1,0);
        });

        changeButton = new Button(170,20,45,45,new PIXI.Texture.fromImage('images/buttonArrowUp.png'),
        new PIXI.Texture.fromImage('images/buttonArrowDown.png'));

        changeButton.addEvent(function(){
            //destroy current
            visualizer.stop();
            visualizer.destroy();

            //get next
            console.log(visualizerIndex);
            visualizerIndex = (visualizerIndex+1)%visualizerList.length;
            console.log(visualizerIndex);
            visualizer = new window[visualizerList[visualizerIndex].className](audioInfo);
            visualizer.start(visContainer);
            console.log('buttonpressedyeah');

            drawUIText();
        });


        micButton = new Button(220,20,45,45,new PIXI.Texture.fromImage('images/micUp.png'),
        new PIXI.Texture.fromImage('images/micDown.png'));

        micButton.addEvent(function(pauseButton){
            //stop music if on
            if(audio.muted == false){
                audio.muted = true;
                var t = pauseButton.buttonTex;
                pauseButton.buttonTex = pauseButton.buttonTexPressed;
                pauseButton.buttonTexPressed = t;
                pauseButton.sprite.texture = pauseButton.buttonTex;
            }
            //start recording

            var handleSuccess = function(stream) {
                micAudio = stream;
                audioInfo.changeSource(stream,'mic');
            };
            
            var handleFailure = function(stream) {
                console.log("This wont work... :(");
            };

            navigator.getUserMedia({audio:true}, handleSuccess, handleFailure);
        }.bind(micButton,pauseButton));


        helpContainer = new PIXI.Container();

        helpText = new PIXI.Text();

        helpText.style = {
            fill: '#A6A835',
            font: '30px',
            stroke: "#2C2D0E",
            strokeThickness: 6,
            fontFamily: 'VT323, monospace'
        };

        helpText.text = " ";
        
        /*
        helpBox = new PIXI.Sprite.fromImage('images/whiteSquare.png');
        helpBox.tint = 0x000000;
        helpBox.alpha = 0.3;
        helpBox.scale.x = 1;
        helpBox.scale.y = 1;
        helpBox.width = 400;
        helpBox.height = 400;
        helpBox.x = 20;
        helpBox.y = 85;
        */
       
        helpText.x = 30;
        helpText.y = 95;

        //helpContainer.addChild(helpBox);
        helpContainer.addChild(helpText);
        buttonContainer.addChild(helpContainer);
        helpContainer.visible = false;
        
        helpButton = new Button(280,20,45,45,new PIXI.Texture.fromImage('images/helpUp.png'),
        new PIXI.Texture.fromImage('images/helpDown.png'));

        helpButton.addEvent(function(){
            helpContainer.visible = !helpContainer.visible
        });


};

//draws UI text and updates position
function drawUIText(){
    
    //update track info
    trackUI.text = "Track: Groove Salad [soma.fm]";
    trackUI.x = WindowWidth - trackUI.width - 20;
    trackUI.y = 20;

    //update visualizer info
    VisUI.text = "Visualizer: " + visualizer.name;    
    VisUI.x = WindowWidth - VisUI.width - 20;
    VisUI.y = 50;
}