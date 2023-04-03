<template>
    <div ref="canvas" class="absolute top-0 bottom-0 left-0 right-0" style='z-index: 0;'></div>
</template>

<script setup>
import * as PIXI from 'pixi.js'
import AudioAnalyser from '../js/AudioAnalyser'
import Vizualiser from '../js/Vizualiser'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref()
const app = ref()
const e = ref(window.addEventListener("resize", onResize))
const vizualiser = ref()
const appticker = ref()

function onResize(e) {
    var w = window.innerWidth;
    var h = window.innerHeight;

    //this part resizes the canvas but keeps ratio the same
    app.value.renderer.view.style.width = w + "px";
    app.value.renderer.view.style.height = h + "px";

    //this part adjusts the ratio:
    app.value.renderer.resize(w,h);
}

onMounted(() => {
    app.value = new PIXI.Application({
        autoResize: true,
        resizeTo: canvas.value,
        backgroundColor: 0x000000,
    })

    //setup canvas
    app.value.renderer.view.style.display = "block"
    
    canvas.value.appendChild(app.value.view)

    vizualiser.value = new Vizualiser(app,props.audioAnalyser)
    app.value.stage = vizualiser.value.stage
    appticker.value = app.value.ticker.add((delta)=>vizualiser.value.update())
    
})

onBeforeUnmount(() => {
    window.removeEventListener("resize",e.value)
})

const props = defineProps({
    audioAnalyser : AudioAnalyser
})
</script>



<style scoped>
</style>