type Props = {
  micEnabled: boolean
  desktopEnabled: boolean
  desktopAvailable: boolean
  listening: boolean
  busy: boolean
  onMicChange: (v: boolean) => void
  onDesktopChange: (v: boolean) => void
  onToggleListen: () => void
  onClear: () => void
}

export function Controls({
  micEnabled,
  desktopEnabled,
  desktopAvailable,
  listening,
  busy,
  onMicChange,
  onDesktopChange,
  onToggleListen,
  onClear
}: Props) {
  return (
    <footer className="controls">
      <div className="toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={micEnabled}
            disabled={listening}
            onChange={(e) => onMicChange(e.target.checked)}
          />
          <span>Microphone</span>
        </label>
        {desktopAvailable ? (
          <label className="toggle" title="Share screen/window with system audio (Chrome/Edge)">
            <input
              type="checkbox"
              checked={desktopEnabled}
              disabled={listening}
              onChange={(e) => onDesktopChange(e.target.checked)}
            />
            <span>Desktop audio</span>
          </label>
        ) : (
          <span className="toggle-hint">
            Desktop audio needs Chrome or Edge on PC (not Firefox). Share entire screen with system audio.
          </span>
        )}
      </div>
      <div className="control-actions">
        <button
          type="button"
          className={listening ? 'btn danger' : 'btn primary'}
          disabled={busy && !listening}
          onClick={onToggleListen}
        >
          {listening ? 'Stop listening' : 'Start listening'}
        </button>
        <button type="button" className="btn" disabled={listening} onClick={onClear}>
          Clear chat
        </button>
      </div>
    </footer>
  )
}
