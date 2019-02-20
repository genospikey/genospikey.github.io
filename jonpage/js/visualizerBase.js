window.onload = function(){
	// Get Browser Info
	WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
    WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;
    
    //create application
    app = new PIXI.Application(WindowWidth,WindowHeight,{backgroundColor: 0x880088});
    
    //testing redraw
    app.renderer.preserveDrawingBuffer = true;
    
    stage = app.stage;
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    canvas = document.body.appendChild(app.view);

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


        app.stage.addChild(trackUI);
        app.stage.addChild(VisUI);

        //add event to start getting info when audio source loads
        audio.addEventListener('canplaythrough', function() {
            
            //create audio info object
            audioInfo = new AudioInfo(audio);

            //i think you can figure this one out
            createButtons();
            
            //add visualizer
            visualizerIndex = 0;
            visualizer = new window[visualizerList[visualizerIndex].className](audioInfo);
            visualizer.start(app.stage);

            drawUIText();
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

        pauseButton.twoButtonMode(new PIXI.Texture.fromImage('images/buttonPauseUp.png'),
            new PIXI.Texture.fromImage('images/buttonPauseDown.png'));


        pauseButton.addEvent(function(){

            //resume capture if suspended
            if (audioInfo.audioCtx.state === 'suspended') {
                audioInfo.audioCtx.resume();
            }

            //unmute if muted
            audio.muted = !audio.muted;
            if(audio.muted==false){
                audio.play();
            }
        }); 

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
            visualizer.start(app.stage);

            drawUIText();
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