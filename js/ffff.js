console.clear();

let Shader = class extends PIXI.Filter {
	constructor(filterText) {
		super('', filterText, uniforms);
	}
};

let stats = new Stats();
let width = window.innerWidth;
let height = window.innerHeight;
let mousedown = false;
let shaders = [ 'SeaScape', 'IndustrialComplex', 'Primitives', 'Flame', 'AwesomeStar', 'VoxelTowers', 'TrainRide', 'Matroshka', 'MarioWorld' ];
let data = {
	Shader: shaders[0],
	shaders: [],
	index: 0
};
let uniforms = {
	iResolution: {
		type: 'v3',
		value: [width, height, 0]
	},
	iGlobalTime: {
		type: 'f',
		value: 0
	},
	iTimeDelta: {
		type: 'f',
		value: 0
	},
	iFrame: {
		type: 'i',
		value: 0
	},
	iMouse: {
		type: 'v4',
		value: [0, 0, 0, 0]
	}
};
for (let i = 0; i < shaders.length; i++) {
	// Get filter text
	let filterText = $('#' + shaders[i].toLowerCase()).text();

	// Search for global assignments that should be #define
	/*for (let uniform in uniforms) {
		if (uniforms.hasOwnProperty(uniform)) {
			let lines = filterText.split('\n');

			for (let i = 0; i < lines.length; i++) {
				// Check if line includes both = and a uniform name
				if (lines[i].includes('=') && lines[i].includes(uniform)) {
					// Get variable name
					let name = new RegExp(' (.*(?==))', 'g').exec(lines[i])[1];
					filterText = filterText.replace(lines[i], '#define ' + name + ' ' + uniform);
				}
			}
		}
	}*/

	// Update mainImage to main
	filterText = filterText.replace('mainImage', 'main');
	filterText = filterText.replace('out vec4 fragColor, in vec2 fragCoord', '');
	filterText = filterText.replace('out vec4 fragColor,in vec2 fragCoord', '');

	// Add uniforms and definitions
	filterText = 'uniform vec2 iResolution;\nuniform float iGlobalTime;\nuniform float iTimeDelta;\nuniform float iFrame;\nuniform vec2 iMouse;\nuniform sampler2D iChannel0;\nuniform sampler2D iChannel1;\nuniform sampler2D iChannel2;\n\n#define fragColor gl_FragColor\n#define fragCoord gl_FragCoord\n' + filterText;

	// Make sure that there is a main() function
	if (!filterText.includes('void main')) {
		filterText = 'void main() {}';
	}

	data.shaders[i] = new PIXI.Filter('', filterText, uniforms);
}
let gui = new dat.GUI();
let controller = gui.add(data, 'Shader', shaders);
controller.onChange((value) => {
	data.index = shaders.indexOf(value);
	data.shaders[data.index].uniforms.iGlobalTime = 0;
	data.shaders[data.index].uniforms.iTimeDelta = 0;
	data.shaders[data.index].uniforms.iFrame = 0;
	sprite.filters = [ data.shaders[data.index] ];
});

let renderer = PIXI.autoDetectRenderer(width, height, {
	view: $('canvas')[0]
});
let stage = new PIXI.Container();
let sprite = new PIXI.Sprite();

$(stats.domElement).css({
	'position': 'absolute',
	'top': '0'
});
$('body').append(stats.domElement);
sprite.width = width;
sprite.height = height;
sprite.filters = [ data.shaders[0] ];
stage.addChild(sprite);

$(window).on('resize', (e) => {
	// Get new width and height
	width = window.innerWidth;
	height = window.innerHeight;

	// Update uniform
	data.shaders[data.index].uniforms.iResolution[0] = width;
	data.shaders[data.index].uniforms.iResolution[1] = height;

	// Full screen sprite
	sprite.width = width;
	sprite.height = height;

	// Resize renderer
	renderer.resize(width, height);
});

$(renderer.view).on('mousedown', (e) => mousedown = true);
$(window).on('mouseup', (e) => mousedown = false);
$(renderer.view).on('mousemove', (e) => {
	if (mousedown) {
		data.shaders[data.index].uniforms.iMouse[0] = e.clientX;
		data.shaders[data.index].uniforms.iMouse[1] = e.clientY;
	}
});

let lastTime = null;
let update = (timestamp) => {
	requestAnimationFrame(update);
	stats.update();

	if (lastTime === null) {
		lastTime = timestamp;
	}

	let delta = (timestamp - lastTime) / 1000;
	let date = new Date();
	lastTime = timestamp;

	data.shaders[data.index].uniforms.iGlobalTime += delta;
	data.shaders[data.index].uniforms.iTimeDelta = delta;
	data.shaders[data.index].uniforms.iFrame++;

	renderer.render(stage);
};

requestAnimationFrame(update);