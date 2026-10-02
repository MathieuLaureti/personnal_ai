import type { PersonnalAIApi } from './index'

declare global {
  interface Window {
    personnalAI: PersonnalAIApi
  }
}

export {}
