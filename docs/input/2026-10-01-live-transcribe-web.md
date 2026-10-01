# Live transcribe web app

## Status
ready-for-github

## Change type
feature

## Summary
LAN web UI with mic toggle, optional desktop/system audio (Chrome/Edge on PC), WhisperX proxy, chat transcript with Person 1/2/3 colors.

## Acceptance criteria
### Scenario 1
- **Given** `npm run dev` in `live-transcribe/` on `0.0.0.0`
- **When** user opens from PC browser and starts mic capture
- **Then** transcript lines appear in chat within ~8s chunks

### Scenario 2
- **When** user enables desktop audio on Chrome/Edge and shares screen with system audio
- **Then** capture starts without NotSupportedError; desktop sound is transcribed

## Out of scope
- Electron shell integration
- True streaming STT

## Notes
- Feature batch: live-transcribe-web
