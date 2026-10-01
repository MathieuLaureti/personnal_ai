import { useEffect, useRef, useState } from 'react'
import { Composer } from './components/Composer'
import { MeetingPanel } from './components/MeetingPanel'
import { MessageBubble } from './components/MessageBubble'
import { ModelPicker } from './components/ModelPicker'
import { useChat } from './hooks/useChat'
import { useRuntime } from './hooks/useRuntime'

type View = 'chat' | 'meeting'

export function App() {
  const { runtime, setActive } = useRuntime()
  const { messages, streaming, send, stop, reset } = useChat()
  const endRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('chat')

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, streaming])

  const last = messages[messages.length - 1]

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <strong>Personnal AI{document.documentElement.dataset.bridge === 'http' ? ' · local API' : ''}</strong>
          <span>
            {runtime.model || 'set config/models.json'}
            {runtime.hasApiKey ? '' : ' · missing .env key'}
          </span>
        </div>
        <div className="header-actions">
          <div className="view-tabs">
            <button
              className={`btn ghost ${view === 'chat' ? 'active' : ''}`}
              type="button"
              onClick={() => setView('chat')}
            >
              Chat
            </button>
            <button
              className={`btn ghost ${view === 'meeting' ? 'active' : ''}`}
              type="button"
              onClick={() => setView('meeting')}
            >
              Meeting
            </button>
          </div>
          {view === 'chat' ? (
            <>
              <ModelPicker
                runtime={runtime}
                disabled={streaming}
                onChange={(id) => {
                  void setActive(id).catch(() => undefined)
                }}
              />
              <button className="btn ghost" type="button" onClick={reset}>
                New chat
              </button>
            </>
          ) : null}
        </div>
      </header>

      {view === 'chat' ? (
        <>
          <main className="transcript">
            <div className="transcript-inner">
              {messages.length === 0 ? (
                <div className="empty">
                  <h2>A quiet place for notes</h2>
                  <p>
                    This chat only reads and writes inside the docs folder from config. Put the API key in <code>.env</code>
                    , pick a model in the header, then ask it to look something up or keep a note.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    streaming={streaming && message.id === last?.id && message.role === 'assistant'}
                  />
                ))
              )}
              <div ref={endRef} />
            </div>
          </main>

          <Composer streaming={streaming} onSend={send} onStop={stop} />
        </>
      ) : (
        <main className="transcript meeting-view">
          <MeetingPanel disabled={streaming} />
        </main>
      )}
    </div>
  )
}
