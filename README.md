# Genospikey.github.io
> A Milkdrop inspired music visualization engine with integrated games and other doodads.
> 
Genospikey.github.io is a dynamic audio visualizer built using Vue.js and PIXI.js. It processes audio data in real-time and provides a variety of visual effects based on the audio input. The visualizers are designed for use as concert backgrounds and music visualizations. It also includes some fun integrated games and other features to enhance your experience.
## Installation
Install NPM and run the following command in the installation directory:
```sh
npm install genospikey.github.io --save
```
## Usage example
Create stunning visual effects for your music, ideal for concerts or personal use. The visualizers react in real-time to the audio input, providing a dynamic and immersive experience. (WOW GOOD JOB COPILOT LOL)

## Step-by-Step Guide
### Create a New Class File:
Navigate to the following directory: `src/js/`

Create a new JavaScript file for your visualizer: `VizualiserNewEffect.js`
### Import Necessary Modules:
In your new file, import the base class you want to extend. For example, if you are extending VizualiserShaderBase, you would do:

```javascript
import VizualiserShaderBase from './VizualiserShaderBase';
Extend the Base Class:

Create a new class that extends the base class you imported.

javascript
class VizualiserNewEffect extends VizualiserShaderBase {
  constructor(app, audioAnalyser) {
    super(app, audioAnalyser);
    // Initialize your visualizer properties here
  }

  initElements() {
    super.initElements();
    // Initialization code here
  }

  update(dt) {
    super.update(dt);
    // Update code here
  }

  destroy() {
    // Custom destroy logic here
    super.destroy();
  }
}

export default VizualiserNewEffect;
```
### Add Custom Logic:
Implement your custom visualizer logic inside the methods initElements(), update(), and destroy(). For instance:
```javascript
initElements() {
  super.initElements();
  // Custom initialization code
  this.effect = new PIXI.Graphics();
  this.stage.addChild(this.effect);
}

update(dt) {
  super.update(dt);
  // Custom update logic
  this.effect.clear();
  // Example effect: Draw circles based on audio data
  for (let i = 0; i < this.audioAnalyser.dataArray.length; i++) {
    const radius = this.audioAnalyser.dataArray[i] / 2;
    this.effect.beginFill(0xFFFFFF * Math.random());
    this.effect.drawCircle(this.app.view.width / 2, this.app.view.height / 2, radius);
    this.effect.endFill();
  }
}

destroy() {
  // Custom destroy logic
  this.stage.removeChild(this.effect);
  this.effect.destroy({ children: true, texture: true, baseTexture: true });
  super.destroy();
}
```
### Register Your New Visualizer:
Open VizualiserList.js.

Import your new visualizer class.

```javascript
import VizualiserNewEffect from './VizualiserNewEffect';
```
Add an entry for your new visualizer in the constructor.
```javascript
this.list.push({ class: VizualiserNewEffect, name: 'New Effect', description: 'A new visual effect for your audio visualization.' });
```
### Test Your Visualizer:
Run your development server with npm run dev.

Open your browser and navigate to http://localhost:5173.

Scroll through the vizualisers with one of the buttons and see it in action!
## Development setup
To set up the development environment, follow these steps:

```sh
npm install
npm run dev
```

## Release History

* 0.0.1
    * Initial release (Work in progress)


## Meta

Jeremy El Guapo – [![Instagram][instagram-image]][instagram-url]

Distributed under the GSL license. See `LICENSE` for more information.

[https://github.com/genospikey/genospikey.github.io](https://github.com/genospikey/genospikey.github.io)

## Contributing

1. Fork it (<https://github.com/genospikey/genospikey.github.io/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[instagram-image]: https://img.shields.io/badge/Instagram-Follow%20%40jeremyelguapo-E4405F?style=flat-square&logo=instagram&logoColor=white
[instagram-url]: https://www.instagram.com/jeremyelguapo/
