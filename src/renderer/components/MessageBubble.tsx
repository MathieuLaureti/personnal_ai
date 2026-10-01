import Markdown from 'react-markdown'
import type { ChatMessage } from '@shared/types'
import { ThinkingBlock } from './ThinkingBlock'

type Props = {
  message: ChatMessage
  streaming: boolean
}

export function MessageBubble({ message, streaming }: Props) {
  if (message.role === 'user') {
    return (
      <article className="msg user">
        <div className="msg-role">You</div>
        <div className="bubble">{message.content}</div>
      </article>
    )
  }

  const tools = message.tools ?? []
  return (
    <article className="msg assistant">
      <div className="msg-role">Note taker</div>
      <ThinkingBlock text={message.thinking ?? ''} streaming={streaming} answerStarted={Boolean(message.content)} />
      {tools.length > 0 && (
        <div className="tools">
          {tools.map((tool) => (
            <div className="tool" key={tool.id}>
              <div>
                <b>{tool.name}</b> · {tool.status}
              </div>
              {tool.result ? <pre>{tool.result}</pre> : null}
            </div>
          ))}
        </div>
      )}
      {(message.content || streaming) && (
        <div className="bubble">
          {message.content ? <Markdown>{message.content}</Markdown> : null}
          {streaming ? <span className="caret" /> : null}
        </div>
      )}
      {message.error ? <div className="msg-error">{message.error}</div> : null}
    </article>
  )
}
