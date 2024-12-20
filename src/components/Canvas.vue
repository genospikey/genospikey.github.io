// This Vue component sets up a PIXI.js application to visualize audio data.
// - It initializes the PIXI application and attaches it to a canvas element.
// - The component handles window resizing to adjust the canvas size and aspect ratio.
// - It includes functionality to switch between different visualizers based on the VizualiserList.
// - The `tick` function updates the audio analyser and the visualizer each frame.
// - `onMounted` sets up the PIXI app and starts the first visualizer.
// - `nextViz` switches to the next visualizer in the list.

<template>
    <div ref="canvas" class="absolute top-0 bottom-0 left-0 right-0" style='z-index: 0;'></div>
</template>

<script setup>
import * as PIXI from 'pixi.js'
import AudioAnalyser from '../js/AudioAnalyser'
import Vizualiser from '../js/Vizualiser'
import VizualiserList from '../js/VizualiserList.js'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref()
const app = ref()
const e = ref(window.addEventListener("resize", onResize))
const vizualiser = ref()
const appticker = ref()
const vizList = ref(new VizualiserList())
const currViz = ref(0)
const ticking = ref(true)

function onResize(e) {
    var w = window.innerWidth
    var h = window.innerHeight

    //this part resizes the canvas but keeps ratio the same
    app.value.renderer.view.style.width = w + "px"
    app.value.renderer.view.style.height = h + "px"

    //this part adjusts the ratio:
    app.value.renderer.resize(w,h)
    vizualiser.value.resize()
}

function startViz(vizualiserClass){
    //setup new viz
    vizualiser.value = new vizualiserClass(app.value, props.audioAnalyser)
    app.value.stage = vizualiser.value.stage
    
    ticking.value = true
}

function tick(delta){
    if(ticking.value){
        props.audioAnalyser.update(delta)
        vizualiser.value.update(delta)   
    }    
}

function nextViz(vizName){
    ticking.value = false
    if(vizualiser.value) vizualiser.value.destroy()

    console.log(vizList.value.list.length)

    currViz.value = (currViz.value + 1) % vizList.value.list.length
    startViz(vizList.value.list[currViz.value].class)

}

onBeforeUnmount(() => {
    window.removeEventListener("resize",e.value)
})

onMounted(() => {
    console.log(vizList.value.list)
    app.value = new PIXI.Application({
        autoResize: true,
        resizeTo: canvas.value,
        backgroundColor: 0x000000,
    })

    //setup canvas
    app.value.renderer.view.style.display = "block"
    
    canvas.value.appendChild(app.value.view)

    startViz(vizList.value.list[currViz.value].class)
    app.value.ticker.add((delta)=>{tick(delta)})
})

const props = defineProps({
    audioAnalyser : AudioAnalyser
})

defineExpose({
    nextViz
})

</script>



<style scoped>
</style>