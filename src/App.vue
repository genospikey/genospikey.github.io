<script setup>
import Canvas from './components/Canvas.vue'
import Button from './components/Button.vue'
import AudioAnalyser from './js/AudioAnalyser'
import { ref } from 'vue'


const buttonStyle = 'w-12 h-12 inline-block text-sm'
const audioPlayer = ref()
const audioText = ref("Groove Salad on Soma.fm")
const audioAnalyser = ref(new AudioAnalyser())
const timer = ref()
const debug_count = ref(0)
const updateRate = 16
const canvas = ref()

async function clicked(button) {
  console.log('i got clicked', button, audioPlayer.value)

  switch (button) {
    case 'play':
      audioPlayer.value.play()
      if (audioAnalyser.value.status != 'running')
        audioAnalyser.value.start(audioPlayer.value)
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
    case 'nextViz':
      canvas.value.nextViz()
      break
    case 'mic':
      if (navigator.mediaDevices.getUserMedia) {
        try {
          const source = await navigator.mediaDevices.getUserMedia({ audio: true })
          audioAnalyser.value.start(source)
        } catch (err) {
          console.error('Error accessing the microphone:', err)
        }
      } else {
        console.error('getUserMedia not supported on your browser!')
      }
      break
  }
}
</script>


<template>
  <audio ref="audioPlayer" style="display:none" crossorigin="anonymous">
    <source src="https://ice6.somafm.com/groovesalad-256-mp3" type="audio/mpeg">
  </audio>
  <div class="absolute left-12 top-12 z-10 flex flex-row gap-3">
    <Button :class="buttonStyle" button-image="play" @click="clicked('play')" />
    <Button :class="buttonStyle" button-image="stop" @click="clicked('stop')" />
    <Button :class="buttonStyle" button-image="voldown" @click="clicked('voldown')" />
    <Button :class="buttonStyle" button-image="volup" @click="clicked('volup')" />
    <Button :class="buttonStyle" button-image="open" @click="clicked('open')" />
    <Button :class="buttonStyle" button-image="resume" @click="clicked('resume')" />
    <Button :class="buttonStyle" button-image="nextViz" @click="clicked('nextViz')" />
    <Button :class="buttonStyle" button-image="mic" @click="clicked('mic')" /> <!-- New button for mic -->
  </div>
  <Canvas :audioAnalyser="audioAnalyser" ref="canvas" />
</template>

