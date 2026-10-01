import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { transcribeApiPlugin } from './vite.transcribe-api'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const whisperBase = env.WHISPERX_BASE_URL || 'http://192.168.2.99:11436'

  return {
    root: resolve(__dirname),
    plugins: [react(), transcribeApiPlugin({ whisperBase })],
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 5174,
      strictPort: false
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 5174
    }
  }
})
