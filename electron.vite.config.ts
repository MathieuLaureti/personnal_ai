import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { chatApiPlugin } from './vite.chat-api'
import { whisperxApiPlugin } from './vite.whisperx-api'

const shared = resolve(__dirname, 'src/shared')

export default defineConfig(({ mode }) => ({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': shared }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': shared }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react(), whisperxApiPlugin(mode), chatApiPlugin()],
    resolve: {
      alias: { '@shared': shared }
    }
  }
}))
