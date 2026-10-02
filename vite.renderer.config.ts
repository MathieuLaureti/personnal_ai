import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { chatApiPlugin } from './vite.chat-api'
import { whisperxApiPlugin } from './vite.whisperx-api'

export default defineConfig(({ mode }) => ({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react(), whisperxApiPlugin(mode), chatApiPlugin()],
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') }
  }
}))
