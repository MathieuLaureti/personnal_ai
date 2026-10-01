import { app, BrowserWindow, dialog, ipcMain, shell, type OpenDialogOptions } from 'electron'
import { join } from 'node:path'
import type { ChatEvent, ChatMessage, MeetingTranscribeRequest } from '../shared/types'
import { runChat } from './chat/runChat'
import { resolveRuntime, setActiveModel } from './config/runtime'
import { runMeetingTranscription } from './meeting/runTranscription'

let mainWindow: BrowserWindow | null = null
let chatAbort: AbortController | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 740,
    minWidth: 720,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#101214',
    title: 'Personnal AI',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function emitChat(event: ChatEvent): void {
  mainWindow?.webContents.send('chat:event', event)
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.mathieu.personnal-ai')
  }

  ipcMain.handle('runtime:get', () => resolveRuntime().info)
  ipcMain.handle('runtime:set-active', (_event, id: string) => setActiveModel(id).info)

  ipcMain.handle('chat:send', async (_event, history: ChatMessage[]) => {
    chatAbort?.abort()
    chatAbort = new AbortController()
    try {
      const { settings } = resolveRuntime()
      await runChat({
        settings,
        history,
        emit: emitChat,
        signal: chatAbort.signal
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      emitChat({ type: 'error', message })
    }
  })

  ipcMain.handle('chat:abort', () => {
    chatAbort?.abort()
    chatAbort = null
  })

  ipcMain.handle('meeting:pick-audio', async () => {
    const options: OpenDialogOptions = {
      title: 'Choose meeting audio',
      properties: ['openFile'],
      filters: [
        { name: 'Audio', extensions: ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'webm', 'mp4'] }
      ]
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('meeting:transcribe', async (event, request: MeetingTranscribeRequest) => {
    const sender = event.sender
    try {
      const result = await runMeetingTranscription({
        audioPath: request.audioPath,
        minSpeakers: request.minSpeakers,
        maxSpeakers: request.maxSpeakers,
        onLog: (line) => {
          sender.send('meeting:progress', { type: 'log', line })
        }
      })
      sender.send('meeting:progress', { type: 'done', result })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      sender.send('meeting:progress', { type: 'error', message })
      throw error
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
