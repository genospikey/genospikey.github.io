// Get Browser Info
WindowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
WindowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 20;

var app = new PIXI.Application(WindowWidth,WindowHeight);
document.body.appendChild(app.view);

var loader = new PIXI.loaders.Loader();

var text = new PIXI.Text('test');
text.x = 150;
text.y = 150;

app.stage.addChild(text);

// List of files to load
var manifest = [
        'images/building.png',
        'images/buildngClose.png'
    ];

//handle onload stuff - go to application
loader.on('complete', startApp);

// Add to the PIXI loader
loader.add(manifest);

loader.load();

var foreground = [];

function startApp(){
    //get time of day

    //draw foreground buildings
    drawForegroundBuildings();
    //draw background buildings

    //start car animations

}

function drawForegroundBuildings(){
    
    console.log('Drawing foreground buildings...');

    var test = PIXI.Sprite.fromImage('images/buildngClose.png');
    foreground[0] = test;
    test.width = 500;
    test.height = 500;
    app.stage.addChild(test);
}