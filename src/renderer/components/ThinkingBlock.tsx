import { useEffect, useState } from 'react'

type Props = {
  text: string
  streaming: boolean
  answerStarted: boolean
}

export function ThinkingBlock({ text, streaming, answerStarted }: Props) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (streaming && !answerStarted) setOpen(true)
    if (answerStarted) setOpen(false)
  }, [streaming, answerStarted])

  if (!text && !streaming) return null

  return (
    <details className="thinking" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span className={streaming && !answerStarted ? 'dot' : 'dot idle'} />
        {streaming && !answerStarted ? 'Thinking' : 'Thought'}
      </summary>
      {text ? <pre className="thinking-body">{text}</pre> : null}
    </details>
  )
}
