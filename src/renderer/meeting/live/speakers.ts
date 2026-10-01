const PERSON_COLORS = [
  '#4a7c9b',
  '#8b6b9e',
  '#6b8f71',
  '#c4846c',
  '#7a8f6e',
  '#9580ba',
  '#5c8a8a',
  '#b08968'
]

export function colorForPerson(person: number): string {
  return PERSON_COLORS[(person - 1) % PERSON_COLORS.length]
}

export class SpeakerRegistry {
  private map = new Map<string, number>()
  private next = 1

  personFor(speaker: string | undefined): number {
    const key = speaker?.trim() || '__default__'
    let person = this.map.get(key)
    if (person === undefined) {
      person = this.next
      this.next += 1
      this.map.set(key, person)
    }
    return person
  }

  reset(): void {
    this.map.clear()
    this.next = 1
  }
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
