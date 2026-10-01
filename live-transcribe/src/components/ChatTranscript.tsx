import type { RefObject } from 'react'
import { colorForPerson } from '../lib/speakers'
import type { ChatMessage } from '../lib/types'

type Props = {
  messages: ChatMessage[]
  bottomRef: RefObject<HTMLDivElement>
}

export function ChatTranscript({ messages, bottomRef }: Props) {
  return (
    <div className="chat" role="log" aria-live="polite" aria-relevant="additions">
      {messages.length === 0 ? (
        <p className="chat-empty">
          Start listening to see the conversation. Speakers appear as Person 1, 2, 3… with
          different colors when diarization is enabled on the server.
        </p>
      ) : (
        messages.map((msg) => (
          <article
            key={msg.id}
            className="chat-row"
            style={{ ['--person-color' as string]: colorForPerson(msg.person) }}
          >
            <div className="chat-meta">
              <span className="chat-person">Person {msg.person}</span>
              <time className="chat-time">{msg.timeLabel}</time>
            </div>
            <div className="chat-bubble">{msg.text}</div>
          </article>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
