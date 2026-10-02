import { useCallback, useEffect, useState } from 'react'
import type { RuntimeInfo } from '@shared/types'

const emptyRuntime: RuntimeInfo = {
  active: '',
  label: 'no model',
  model: '',
  provider: 'gemini',
  docsFolder: '',
  hasApiKey: false,
  models: []
}

export function useRuntime() {
  const [runtime, setRuntime] = useState<RuntimeInfo>(emptyRuntime)

  useEffect(() => {
    void window.personnalAI.getRuntime().then(setRuntime).catch(() => undefined)
  }, [])

  const setActive = useCallback(async (id: string) => {
    const next = await window.personnalAI.setActiveModel(id)
    setRuntime(next)
    return next
  }, [])

  return { runtime, setActive }
}
