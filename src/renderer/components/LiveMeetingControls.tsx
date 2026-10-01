type Props = {
  micEnabled: boolean
  desktopEnabled: boolean
  desktopAvailable: boolean
  listening: boolean
  busy: boolean
  onMicChange: (value: boolean) => void
  onDesktopChange: (value: boolean) => void
  onToggleListen: () => void
  onClear: () => void
}

export function LiveMeetingControls({
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
    <div className="live-meeting-controls">
      <div className="live-meeting-toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={micEnabled}
            disabled={listening}
            onChange={(event) => onMicChange(event.target.checked)}
          />
          <span>Microphone</span>
        </label>
        {desktopAvailable ? (
          <label className="toggle" title="Share screen/window with system audio (Chrome/Edge/Electron)">
            <input
              type="checkbox"
              checked={desktopEnabled}
              disabled={listening}
              onChange={(event) => onDesktopChange(event.target.checked)}
            />
            <span>Desktop audio</span>
          </label>
        ) : (
          <span className="toggle-hint">
            Desktop audio needs Chromium on desktop (Chrome, Edge, or Electron). Share entire screen with system audio.
          </span>
        )}
        <span className="toggle-hint">Use microphone or desktop audio, not both — avoids duplicate transcription.</span>
      </div>
      <div className="live-meeting-control-actions">
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
    </div>
  )
}
