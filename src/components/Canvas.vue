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
    //clear out existing tickers and destroy current viz
    app.value.ticker.remove((delta)=>{tick(delta)})
    if(vizualiser.value) vizualiser.value.destroy()

    //setup new viz
    vizualiser.value = new vizualiserClass(app.value, props.audioAnalyser)
    app.value.stage = vizualiser.value.stage

    app.value.ticker.add((delta)=>{tick(delta)})
}

function tick(delta){
    props.audioAnalyser.update()
    vizualiser.value.update()   
}

function nextViz(vizName){
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