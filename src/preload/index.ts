import { contextBridge, ipcRenderer } from 'electron'
import type { ChatEvent, ChatMessage, MeetingProgressEvent, MeetingTranscribeRequest, MeetingTranscribeResult, RuntimeInfo } from '@shared/types'

const api = {
  getRuntime: (): Promise<RuntimeInfo> => ipcRenderer.invoke('runtime:get'),
  setActiveModel: (id: string): Promise<RuntimeInfo> => ipcRenderer.invoke('runtime:set-active', id),
  sendChat: (history: ChatMessage[]): Promise<void> => ipcRenderer.invoke('chat:send', history),
  abortChat: (): Promise<void> => ipcRenderer.invoke('chat:abort'),
  onChatEvent: (listener: (event: ChatEvent) => void): (() => void) => {
    const wrapped = (_event: unknown, payload: ChatEvent): void => listener(payload)
    ipcRenderer.on('chat:event', wrapped)
    return () => {
      ipcRenderer.removeListener('chat:event', wrapped)
    }
  },
  pickMeetingAudio: (): Promise<string | null> => ipcRenderer.invoke('meeting:pick-audio'),
  transcribeMeeting: (request: MeetingTranscribeRequest): Promise<MeetingTranscribeResult> =>
    ipcRenderer.invoke('meeting:transcribe', request),
  onMeetingProgress: (listener: (event: MeetingProgressEvent) => void): (() => void) => {
    const wrapped = (_event: unknown, payload: MeetingProgressEvent): void => listener(payload)
    ipcRenderer.on('meeting:progress', wrapped)
    return () => {
      ipcRenderer.removeListener('meeting:progress', wrapped)
    }
  }
}

contextBridge.exposeInMainWorld('personnalAI', api)

export type PersonnalAIApi = typeof api
