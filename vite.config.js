import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: 'https://genospikey.github.io/',
  assetsDir:'https://genospikey.github.io/assets/',
  plugins: [vue()]
})
