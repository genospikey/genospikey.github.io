window.onload = function(){
	// Get Browser Info
	WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
	WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;

    //create application
    app = new PIXI.Application(WindowWidth,WindowHeight,{backgroundColor: 0x110033});
    
    //testing redraw
    app.renderer.preserveDrawingBuffer = true;
    
    stage = app.stage;
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    document.body.appendChild(app.view);

    //setup AudioInfo object
    audioInfo = new AudioInfo();
    
    //setup Audio source
    audio = new Audio('http://ice1.somafm.com/groovesalad-128-mp3');
    audio.crossOrigin = "anonymous";
    audio.muted = true;
    dataArrayFreq = [];	
    dataArrayWave = [];

    //add event to start getting info when audio source loads
	audio.addEventListener('canplaythrough', function() {
        
        //create audio context
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        //create analyser object
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;

        //setup audio connections to analyser and output
        source = audioCtx.createMediaElementSource(audio);
		source.connect(analyser);
		source.connect(audioCtx.destination);
        
        //create buffer array
		bufferLength = analyser.frequencyBinCount;
		dataArrayFreq = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArrayFreq);
        
        //create other buffer array
        dataArrayWave = new Uint8Array(analyser.fftSize); 
        analyser.getByteTimeDomainData(dataArrayWave);

        //add audio visualizer update function to ticker
		audioInfo.ticker = app.ticker.add(function(){
			audioVisualizerUpdate();
		});
        
        //create pause button
        pauseButton = new Button(20,20,50,50,new PIXI.Texture.fromImage('images/buttonPauseUp.png'),
            new PIXI.Texture.fromImage('images/buttonPauseDown.png'));

        pauseButton.addEvent(function(){

            //resume capture if suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            //unmute if muted
            audio.muted = !audio.muted;
            if(audio.muted==false)
                audio.play();
        }); 

        volUpButton = new Button(70,20,50,50,new PIXI.Texture.fromImage('images/buttonPauseUp.png'),
        new PIXI.Texture.fromImage('images/buttonPauseDown.png'));

        volUpButton.addEvent(function(){

            //resume capture if suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            //unmute if muted
            audio.muted = !audio.muted;
            if(audio.muted==false)
                audio.play();
        }); 

        volDownButton = new Button(120,20,50,50,new PIXI.Texture.fromImage('images/buttonPauseUp.png'),
        new PIXI.Texture.fromImage('images/buttonPauseDown.png'));

        volDownButton.addEvent(function(){

            //resume capture if suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            //unmute if muted
            audio.muted = !audio.muted;
            if(audio.muted==false)
                audio.play();
        }); 
    });

    //create audio update function
    function audioVisualizerUpdate (){
        analyser.getByteFrequencyData(dataArrayFreq);
        analyser.getByteTimeDomainData(dataArrayWave);
        audioInfo.update(dataArrayFreq);
        drawWaveform();
    };

    //setup loader and add manifest
    loader = app.loader;
    loader.add('images/whiteSquare.png');
    loader.on('complete', startApp);
    loader.load();

    //setup waveform animation
    waveform = new PIXI.Graphics();
    waveformHistory = [];
    waveformSprites = [];

    function drawWaveform(){
        
        waveform.clear()
        
        //check for new data
        var empty = true;
        dataArrayWave.forEach((e)=>{if(e != 128) empty = false;});
        
        //if data exists and not empty, draw
        if(dataArrayWave && !(empty)){

            //set num segments
            var segments = 200;

            // set a fill and line style
            waveform.beginFill(0xFF3300);
            waveform.fillAlpha = 0;
            waveform.lineStyle(2, 0xffd900, 1);

            // draw waveform
            for(x = 0; x < segments; x++){
                var index = Math.min(Math.floor(x*dataArrayWave.length/segments),dataArrayWave.length-1);
                var y = (dataArrayWave[index]/128)*WindowWidth/4;
                
                //draw segment
                if(x==0)
                    waveform.moveTo(0,y);
                else
                    waveform.lineTo(x/segments*WindowWidth,y);
            }

            waveform.endFill();
            waveformTexture = app.renderer.generateTexture(waveform);
            waveformHistory.push(waveformTexture);

            if(waveformHistory.length > 10){
                var tex = waveformHistory.shift();
                tex.destroy(true);
            }

            for(var x = 0; x < 10; x++)
                if(waveformHistory[x])
                    waveformSprites[x].texture = waveformHistory[x]; 
        }
    }
    
    function startApp() {
        
        //add waveform sprites when app is ready
        for(var x = 0; x<10;x++){
            waveformSprites[x] = new PIXI.Sprite();
            waveformSprites[x].anchor.set(0,0.5);
            waveformSprites[x].y = WindowHeight/2;
            waveformSprites[x].scale.y = 1 - x/20;
            waveformSprites[x].alpha = Math.max(1 - (0.2455415/0.2505526)*(1 - Math.pow(2.71828,-0.2505526*x)),0);           
            app.stage.addChild(waveformSprites[x]);
        }
    }
}

window.addEventListener("resize", function() {
    WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
	WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;
    app.renderer.resize(WindowWidth , WindowHeight);
  });