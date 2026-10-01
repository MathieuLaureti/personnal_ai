import type { RuntimeInfo } from '@shared/types'

type Props = {
  runtime: RuntimeInfo
  disabled?: boolean
  onChange: (id: string) => void
}

export function ModelPicker({ runtime, disabled, onChange }: Props) {
  return (
    <label className="model-picker">
      <span>Model</span>
      <select
        value={runtime.active}
        disabled={disabled || runtime.models.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        {runtime.models.length === 0 ? (
          <option value="">No models in config</option>
        ) : (
          runtime.models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
              {model.hasApiKey ? '' : ' (missing key)'}
            </option>
          ))
        )}
      </select>
    </label>
  )
}
