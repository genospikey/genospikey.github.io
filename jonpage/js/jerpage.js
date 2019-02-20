window.onload = function(){
	// Get Browser Info
	WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
	WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;

	app = new PIXI.Application(WindowWidth,WindowHeight,{backgroundColor: 0x110033});
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
	document.body.appendChild(app.view);
	


	AI = new AudioInfo();
	AI.addEvent(0,function(){
		for(x = 0; x < Math.ceil(Math.random()*5) + 5; x++)
			carSprites.push(addCar(0, WindowHeight - Math.random()*(WindowWidth/3) - WindowWidth/10, Math.random()*.2+.2, 1, 3 + Math.random(), carTexture, carTrim));
	});

	// add audio buttons
	function addButton(buttonTex,buttonTexPressed,x,y,onDown,onUp){
		var button = new PIXI.Sprite(buttonTex);
		button.interactive = true;
		button.buttonMode = true;

		button.x = x;
		button.y = y;

		button
			.on('pointerdown',function(){
				onDown();
				button.texture = buttonTexPressed;
			})
			.on('pointerup',function(){
				onUp();
				button.texture = buttonTex;
			})
			.on('pointerupoutside',function(){
				onUp();
				button.texture = buttonTex;
			})

		app.stage.addChild(button);
		// console.log(button);
	}

	//create external loader
	var loader = new PIXI.loaders.Loader();

	//create group
	bgGroup3 = new PIXI.display.Group(0,false);
	farBGGroup3 = new PIXI.display.Group(1,false);
	fartherBGGroup = new PIXI.display.Group(2,false);
	farBGGroup = new PIXI.display.Group(3,false);
	farCarGroup = new PIXI.display.Group(4,false);
	farCarGroup2 = new PIXI.display.Group(4,false);
	trainGroup = new PIXI.display.Group(5,false);
	trainGroup2 = new PIXI.display.Group(4,false);
	fgGroup = new PIXI.display.Group(7,false);
	bgGroup = new PIXI.display.Group(6,false);


	//new stage?
	app.stage = new PIXI.display.Stage();
	app.stage.group.enableSort = true;
	
	//add groups to display
	app.stage.addChild(new PIXI.display.Layer(fgGroup));
	app.stage.addChild(new PIXI.display.Layer(bgGroup));
	app.stage.addChild(new PIXI.display.Layer(farBGGroup));
	app.stage.addChild(new PIXI.display.Layer(fartherBGGroup));
	app.stage.addChild(new PIXI.display.Layer(trainGroup));
	app.stage.addChild(new PIXI.display.Layer(farCarGroup));
	app.stage.addChild(new PIXI.display.Layer(trainGroup2));
	app.stage.addChild(new PIXI.display.Layer(farCarGroup2));
	app.stage.addChild(new PIXI.display.Layer(farBGGroup3));
	app.stage.addChild(new PIXI.display.Layer(bgGroup3));


	// List of files to load
	var manifest = [
			'images/building2.png',
			'images/building3.png',
			'images/buildngClose2.png',
			'images/buildingSide1.png',
			'images/train.png',
			'images/trainFront.png',
			'images/trainCar.png',
			'images/whiteSquare.png'
		];

	//handle onload stuff - go to application
	loader.on('complete', startApp);

	// Add to the PIXI loader
	loader.add(manifest);

	loader.load();

	var foreground = [];
	var background = [];
	var train = [];

	audio = new Audio('http://ice1.somafm.com/groovesalad-128-mp3');
	audio.crossOrigin = "anonymous";
	dataArray = [];	

	audio.addEventListener('canplaythrough', function() {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		analyser = audioCtx.createAnalyser();
		source = audioCtx.createMediaElementSource(audio);
		source.connect(analyser);
		source.connect(audioCtx.destination);
		analyser.fftSize = 512;
		bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);
		analyser.getByteFrequencyData(dataArray);

		app.ticker.add(function(){
			audioVisualizerUpdate();
		});
		
		if (audioCtx.state === 'suspended') {
			audioCtx.resume();
		}

	},false);
	
	function startApp() {
		//get time of day
		
		//draw foreground buildings
		drawForegroundBuildings();

		//draw background buildings
		drawBackgroundBuildings();
		drawFarBackgroundBuildings();
		//draw train
		drawTrain();

		//draw text
		drawText();
		drawCars();

		drawBackground();

		addButton(new PIXI.Texture.fromImage('images/buttonUpUp.png'),new PIXI.Texture.fromImage('images/buttonUpDown.png'),WindowWidth - 150,30,
			function(){
					// console.log('down');
					audio.volume = Math.min(1,audio.volume + .1);
					audio.muted = false;
					audio.play();
				},
			function(){
					// console.log('up');
				});

		addButton(new PIXI.Texture.fromImage('images/buttonDownUp.png'),new PIXI.Texture.fromImage('images/buttonDownDown.png'),WindowWidth - 100,30,
			function(){
					// console.log('down');
					audio.volume = Math.max(0,audio.volume - .1);
					audio.muted = false;
					audio.play();
				},
			function(){
					// console.log('up');
				});

		addButton(new PIXI.Texture.fromImage('images/buttonPauseUp.png'),new PIXI.Texture.fromImage('images/buttonPauseDown.png'),WindowWidth - 50,30,
			function(){
					// console.log('muted');
					audio.muted = !audio.muted;
					if(audio.muted==false)
						audio.play();
				},
			function(){
					// console.log('not muted');
				});

				
		addButton(new PIXI.Texture.fromImage('images/buttonPauseUp.png'),new PIXI.Texture.fromImage('images/buttonPauseDown.png'),WindowWidth - 200,30,
		function(){
				
				app.ticker.stop();

				if(carTicker)
					app.ticker.remove(carTicker);
				if(trainTicker)
					app.ticker.remove(trainTicker);
				
				app.stage.children.forEach(function(e){
					if(e.buttonMode == false )
						e.destroy(true);
				});

				drawBackground();
				app.ticker.start();
			},
		function(){
			});


		//audio stuff
		AS = new AudioSquare(WindowWidth/2,WindowHeight/6,farBGGroup3);
		AI.addEvent(0,function(){AS.spin();});
		AI.addEvent(1,function(){AS.spin();});
		AI.addEvent(2,function(){AS.spin();});
	//everyone loves groove salad!
	}
	
	function audioVisualizerUpdate(){
		analyser.getByteFrequencyData(dataArray);
		AI.update(dataArray);
	};

	function drawBackground() {
		var bg = new PIXI.Sprite.fromImage('images/bg2.png');
		bg.scale = 1;
		bg.x = 0;
		bg.y = WindowHeight;
		bg.anchor.set(0,1);
		bg.width = WindowWidth * 2;
		bg.height = WindowWidth * 2;
		bg.parentGroup = bgGroup3;
		
		app.stage.addChild(bg);
	}

	function drawForegroundBuildings() {
		
		// console.log('Drawing foreground buildings...');
	
		new Building(20, WindowHeight - WindowWidth/12, WindowWidth/3, 0.2, WindowWidth, WindowHeight,app.stage, fgGroup, fgGroup, fgGroup);
	}
	
	function drawBackgroundBuildings() {
		// console.log("Drawing background buildings...")

		let colorMatrix = new PIXI.filters.ColorMatrixFilter();
		colorMatrix.matrix = 
		[.7, 0, 0, 0, 0, 
		0, .7, 0, 0, 0, 
		0, 0, .8, 0, 0, 
		0, 0, 0, 1, 0]

		new Building(WindowWidth - WindowWidth/5, Math.max(0,WindowHeight-WindowWidth/2), WindowWidth/6, 0.2, WindowWidth, WindowHeight,app.stage, bgGroup, bgGroup, bgGroup, colorMatrix);
		
	}

	function drawFarBackgroundBuildings() {
		// console.log("Drawing far background buildings...")
		var x = Math.random() * 50;
		let colorMatrix = new PIXI.filters.ColorMatrixFilter();
		colorMatrix.matrix = 
		[.3, 0, 0, 0, 0, 
		0, .3, 0, 0, 0, 
		0, 0, .5, 0, 0, 
		.2, 0, .2, 1, 0]
		
		while(x<WindowWidth){
			var width = Math.random() * WindowWidth/10 + WindowWidth/15;
			Building(x, WindowHeight - (Math.random() * WindowWidth/5 + WindowWidth/10), width, 0.06, WindowWidth, WindowHeight,app.stage,farBGGroup, farBGGroup, farBGGroup, colorMatrix);
			x += width + Math.random() * WindowWidth/30 + WindowWidth/80;
		}

		x = Math.random() * 50 * -1;
		let colorMatrixFar = new PIXI.filters.ColorMatrixFilter();
		colorMatrixFar.matrix = 
		[.15, 0, 0, 0, 0, 
		0, .15, 0, 0, 0, 
		0, 0, .35, 0, 0, 
		.1, .1, .1, 1, 0]
		
		
		while(x<WindowWidth){
			var width = Math.random() * WindowWidth/15 + WindowWidth/25;
			Building(x, WindowHeight - (Math.random() * WindowWidth/14 + WindowWidth/16), width, 0.04,WindowWidth, WindowHeight,app.stage,fartherBGGroup, fartherBGGroup, fartherBGGroup, colorMatrixFar);
			x += width + Math.random() * WindowWidth/50 + WindowWidth/120;
		}
	}

	var trainRunning = false;
	var trainStart = false;

	function drawTrain(){
		// console.log('Drawing train...');
		
		var texture = PIXI.Texture.fromImage('images/train.png');
		
		train[0] = new PIXI.extras.TilingSprite(
			texture,
			WindowWidth,
			WindowHeight
		);
		
		train[0].y = WindowHeight - WindowWidth / 4;
		
		train[0].tileScale.x = (WindowWidth / 3)/texture.height;
		train[0].tileScale.y = (WindowWidth / 3)/texture.height;

		train.forEach(function(e){
			e.parentGroup = trainGroup;
			app.stage.addChild(e);
		});

		app.ticker.add(trainTicker = function(){
			if(trainRunning == false && trainSprite.length == 0 && Math.random() < .005)
				//drawTrainCars();
				drawTrainCars(train[0]);
			else if(trainStart == true){
				trainSprite.forEach(function(trainCar, index, object){
					//move the car
					trainCar.move();

					//if the car hits the end of the screen delete
					if(trainCar.x < 0 - 500 || trainCar.x > WindowWidth + 500){
						//app.stage.removeChild(car._destroyed);
						trainCar.destroy();
						trainSprite.splice(index,1);
					}
				});
			}
			if(trainSprite.length==0){
				trainStart = false;
				trainRunning = false;
			}
		});
	}

	trainSprite = [];
	function drawTrainCars(train){
		// console.log('drawing train cars..');

		trainRunning = true;
		if(Math.random()<.5) var dir = 1;
		else var dir = -1;

		// var trainFront = new PIXI.Texture.fromImage('images/trainFront.png');
		// var trainCar = new PIXI.Texture.fromImage('images/trainCar.png');

		
		trainSprite[0] = PIXI.Sprite.fromImage('images/trainFront.png');

		trainSprite[0].scale = 1;
		trainSprite[0].y =  train.y + WindowWidth / 150;
		trainSprite[0].height = WindowWidth/60;
		trainSprite[0].parentGroup = trainGroup2;

		trainSprite[0].direction = dir;
		trainSprite[0].width = -1 * dir * WindowWidth/30;

		if(dir == 1)	trainSprite.x = 0;
		else trainSprite[0].x = WindowWidth;
		
		for(var x = 1; x < Math.ceil(Math.random()*6)+4; x++){
			var trainTemp = PIXI.Sprite.fromImage('images/trainCar.png');
			trainTemp.scale = 1;
			trainTemp.direction = trainSprite[0].direction;
			if(trainTemp.direction == -1)
				trainTemp.x = trainSprite[0].x - ((x) * trainSprite[0].width + 1)*trainSprite[0].direction;
			if(trainTemp.direction == 1)
				trainTemp.x = trainSprite[0].x - ((x + 1) * trainSprite[0].width + 1)*trainSprite[0].direction;
			trainTemp.y = trainSprite[0].y;
			trainTemp.width = trainSprite[0].width;
			trainTemp.height = trainSprite[0].height;
			trainTemp.parentGroup = trainGroup2;
			trainSprite[x] = trainTemp;
		}

		trainSprite.forEach(function(e){
			app.stage.addChild(e);
			e.speed = WindowWidth/2000;
			e.move = function (){
				this.x += app.ticker.elapsedMS * this.speed * this.direction;
			};
		});

		trainStart = true;
	}

	function drawText(){
		var text1 = new PIXI.Text("Cyberpunk AF-1337"); // the higher this number the crispier the text
		text1.style = {
			fill: 'white',
			font: '15px Press Start 2P'
		};
		text1.x = 30;
		text1.y = 30;
		text1.parentGroup = fgGroup;

		app.stage.addChild(text1);
	}

	function drawCars(){
		carSprites = [];
		carTimer = 0;
		carTexture = new PIXI.Texture.fromImage('/images/car1.png');
		carTrim = new PIXI.Texture.fromImage('/images/car1trim.png');
		app.ticker.add(carTicker = function() { 
			carSprites.forEach(function(car, index, object){
				//move the car
				car.move();

				//if the car hits the end of the screen delete
				if(car.x < 0 - 200 || car.x > WindowWidth + 200){
					//app.stage.removeChild(car._destroyed);
					car.destroy();
					object.splice(index,1);
				}
			});

			carTimer -= app.ticker.deltaTime;
			if(carTimer<0 && Math.random()<.05){
				for(x = 0; x < Math.ceil(Math.random()*4) ; x++)
					carSprites.push(addCar(0, WindowHeight - Math.random()*(WindowWidth/3) - WindowWidth/10, Math.random()*.2+.2, 1, 1 + Math.random(), carTexture, carTrim));
				carTimer += 10;
			}
		});
	}

	function addCar(x, y, depthFactor, direction, speed, carTexture, carTrimTexture){


		var car = new PIXI.Sprite(carTexture);
		
		car.scale = 1;

		if(depthFactor<.25) {
			car.direction = -1;
			car.x = WindowWidth + 100;
			car.width = WindowWidth/15 * depthFactor * car.direction;
		}  
		else {
			car.direction = 1;
			car.x = -100;
			car.width = WindowWidth/15 * depthFactor * car.direction;
		}
		//car.tint = 
		car.y = y;
		car.height = WindowWidth/30 * depthFactor;
		

		car.speed = speed * depthFactor;

		tints = [
			0xFF55FF,
			0x331133,
			0xFF0000,
			0x337733,
			0x110588,
			0x0000FF,
			0x22AA22,
			0xFFAA00,
			0x0077BB,
			0xBB00BB,
			Math.random() * 0xFFFFFF
		];

		car.tint = tints[Math.floor(Math.random() * tints.length)];

		var carTrim = new PIXI.Sprite(carTrimTexture);
		carTrim.setParent(car);
		carTrim.updateTransform(car);
		
		if(depthFactor<.25){
			car.parentGroup = farCarGroup;
			carTrim.parentGroup = farCarGroup2;
		}
		else{
			car.parentGroup = trainGroup;
			carTrim.parentGroup = trainGroup2;
		}

		var x = app.stage.addChild(car);
		x.trim = carTrim;
		car.zOrder = 1;
		carTrim.zOrder = 2;

		car.move = function(){
			this.x += app.ticker.elapsedMS * this.speed * this.direction;
			//this.trim.x += app.ticker.elapsedMS * this.speed * this.direction;
			// console.log(app.ticker.time,this.x,this.y);
		};

		return x;
	}
}