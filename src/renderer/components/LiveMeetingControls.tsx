import type { TranscriptionLanguage } from '../meeting/live/types'

type Props = {
  micEnabled: boolean
  desktopEnabled: boolean
  desktopAvailable: boolean
  language: TranscriptionLanguage
  listening: boolean
  busy: boolean
  onMicChange: (value: boolean) => void
  onDesktopChange: (value: boolean) => void
  onLanguageChange: (value: TranscriptionLanguage) => void
  onToggleListen: () => void
  onClear: () => void
}

export function LiveMeetingControls({
  micEnabled,
  desktopEnabled,
  desktopAvailable,
  language,
  listening,
  busy,
  onMicChange,
  onDesktopChange,
  onLanguageChange,
  onToggleListen,
  onClear
}: Props) {
  return (
    <div className="live-meeting-controls">
      <div className="live-meeting-options">
        <div className="option-group">
          <span className="option-label">Language</span>
          <div className="segmented" role="group" aria-label="Transcription language">
            <button
              type="button"
              className={`segmented-btn ${language === 'en' ? 'active' : ''}`}
              disabled={listening}
              onClick={() => onLanguageChange('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`segmented-btn ${language === 'fr' ? 'active' : ''}`}
              disabled={listening}
              onClick={() => onLanguageChange('fr')}
            >
              Français
            </button>
          </div>
        </div>

        <div className="option-group source-toggles">
          <span className="option-label">Audio source</span>
          <div className="toggle-row">
            <button
              type="button"
              className={`toggle-chip ${micEnabled ? 'active' : ''}`}
              disabled={listening}
              onClick={() => onMicChange(!micEnabled)}
            >
              Microphone
            </button>
            {desktopAvailable ? (
              <button
                type="button"
                className={`toggle-chip ${desktopEnabled ? 'active' : ''}`}
                disabled={listening}
                title="Share screen with system audio"
                onClick={() => onDesktopChange(!desktopEnabled)}
              >
                Desktop audio
              </button>
            ) : (
              <span className="toggle-hint">Desktop capture needs Chrome, Edge, or Electron.</span>
            )}
          </div>
          <p className="toggle-hint">Pick one source — not both — to avoid duplicate lines.</p>
        </div>
      </div>

      <div className="live-meeting-control-actions">
        <button
          type="button"
          className={`btn btn-lg ${listening ? 'danger' : 'primary'}`}
          disabled={busy && !listening}
          onClick={onToggleListen}
        >
          {listening ? 'Stop listening' : 'Start listening'}
        </button>
        <button type="button" className="btn btn-lg ghost" disabled={listening} onClick={onClear}>
          Clear chat
        </button>
      </div>
    </div>
  )
}
