import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { chatApiPlugin } from './vite.chat-api'

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react(), chatApiPlugin()],
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') }
  }
})
