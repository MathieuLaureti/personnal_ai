import type { RefObject } from 'react'
import { colorForPerson } from '../meeting/live/speakers'
import type { LiveTranscriptMessage } from '../meeting/live/types'

type Props = {
  messages: LiveTranscriptMessage[]
  bottomRef: RefObject<HTMLDivElement>
}

export function LiveMeetingTranscript({ messages, bottomRef }: Props) {
  return (
    <div className="live-meeting-chat" role="log" aria-live="polite" aria-relevant="additions">
      {messages.length === 0 ? (
        <p className="live-meeting-empty">
          Start listening to see the conversation. Speakers appear as Person 1, 2, 3… with different colors when
          diarization is enabled on WhisperX.
        </p>
      ) : (
        messages.map((msg) => (
          <article
            key={msg.id}
            className="live-meeting-row"
            style={{ ['--person-color' as string]: colorForPerson(msg.person) }}
          >
            <div className="live-meeting-meta">
              <span className="live-meeting-person">Person {msg.person}</span>
              <time className="live-meeting-time">{msg.timeLabel}</time>
            </div>
            <div className="live-meeting-bubble">{msg.text}</div>
          </article>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
