<script setup>
import Canvas from './components/Canvas.vue'
import Button from './components/Button.vue'
import AudioAnalyser from './js/AudioAnalyser'
import { ref, onMounted } from 'vue'


const buttonStyle = 'w-12 h-12 inline-block text-sm'
const audioPlayer = ref()
const audioText = ref("Groove Salad on Soma.fm")
const audioAnalyser = ref(new AudioAnalyser())
const timer = ref()
const debug_count = ref(0)
const updateRate = 16

function clicked(button){
  console.log('i got clicked',button,audioPlayer.value)

  switch(button){
    case 'play':
      audioPlayer.value.play()
      break
    case 'stop':
      audioPlayer.value.pause()
      break
    case 'volup':
      audioPlayer.value.volume = Math.min(1.0, audioPlayer.value.volume + 0.1)
      break
    case 'voldown':
      audioPlayer.value.volume = Math.max(0.0, audioPlayer.value.volume - 0.1)
      break

  }
}

function startViz(){
  console.log(audioAnalyser.value)
  audioAnalyser.value.start(audioPlayer.value)

  //start timer
  timer.value = window.setInterval(updateViz,updateRate)
}

function updateViz(){
  debug_count.value++
  audioAnalyser.value.update()
}

onMounted(() => {
  
})

</script>

<template>
  <audio ref="audioPlayer" style="display:none" @play="startViz()" crossorigin="anonymous">
    <source src="https://ice6.somafm.com/groovesalad-256-mp3" type="audio/mpeg">
  </audio>
  <div class="absolute left-12 top-12 z-10 flex flex-row gap-3">
    <Button :class="buttonStyle" button-image="play" @click="clicked('play')"/>
    <Button :class="buttonStyle" button-image="stop" @click="clicked('stop')"/>
    <Button :class="buttonStyle" button-image="voldown" @click="clicked('voldown')"/>
    <Button :class="buttonStyle" button-image="volup" @click="clicked('volup')"/>
    <Button :class="buttonStyle" button-image="open" @click="clicked('open')"/>
    <Button :class="buttonStyle" button-image="resume" @click="clicked('resume')"/>
  </div>
  <div class="absolute left-12 top-32 z-10 text-white font-display">{{audioText}} {{ debug_count }}</div>
  <div v-if="audioAnalyser.dataArray" class="absolute left-12 top-36 z-10 w-full text-white font-display break-words">{{audioAnalyser.dataArray}}</div>
  <div v-if="audioAnalyser.freqArray" class="absolute left-12 top-64 z-10 w-full text-white font-display break-words">{{audioAnalyser.freqArray}}</div>
  <div v-if="audioAnalyser.freqArrayMax" class="absolute left-12 top-[480px] z-10 w-full text-white font-display break-words">{{audioAnalyser.freqArrayMax}}</div>
  <Canvas :audioAnalyser="audioAnalyser" />
</template>
