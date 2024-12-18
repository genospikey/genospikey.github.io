<template>
    <div
        @mouseover="hover = true"
        @mouseenter="hover = true"
        @mouseleave="hover = false; press = false"
        @mouseout="hover = false; press = false"
        @mousedown="press = true"
        @mouseup="press = false"
        class="relative bg-cover align-middle border-4 b"
        :class="bg()"
    >
        <img :src="'/' + buttonImage + '.png'" class="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" draggable="false">
        <p class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 select-none">{{ buttonText }}</p>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const hover = ref(false)
const press = ref(false)

function bg(){
    if (press.value == true)
        return "bg-[#dddd00] border-[#dddd00]"

    if (hover.value == true)
        return "bg-[#ffff00] border-[#dddd00]"

    return 'bg-[#ffff00] border-[#ffff00]'
}

const props = defineProps({
    buttonText: {type: String , required: false},
    buttonImage: {type: String, required: false}
})
</script>