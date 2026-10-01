import { useLayoutEffect, useRef } from 'react'

type Props = {
  streaming: boolean
  onSend: (text: string) => Promise<void>
  onStop: () => Promise<void>
}

export function Composer({ streaming, onSend, onStop }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`
  })

  async function submit(): Promise<void> {
    const node = ref.current
    if (!node || streaming) return
    const value = node.value
    node.value = ''
    node.style.height = 'auto'
    await onSend(value)
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="composer-inner">
        <textarea
          ref={ref}
          rows={1}
          placeholder="Ask the note taker…"
          disabled={streaming}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
        />
        {streaming ? (
          <button className="btn" type="button" onClick={() => void onStop()}>
            Stop
          </button>
        ) : (
          <button className="btn primary" type="submit">
            Send
          </button>
        )}
      </div>
    </form>
  )
}
