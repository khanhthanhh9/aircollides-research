import { weeks as starterWeeks } from './data'
import type { Block, Week } from './types'

const STORE = 'research-journey-entries-v1'
const REVISION_STORE = 'research-journey-revisions-v1'

export type Revision = { id: string; weekId: string; action: string; savedAt: string; blocks: Block[]; study?: Week['study'] }

export function loadWeeks(): Week[] {
  try {
    const saved = localStorage.getItem(STORE)
    if (!saved) return structuredClone(starterWeeks)
    const weeks = JSON.parse(saved) as Week[]
    return starterWeeks.map((starter) => {
      const week = weeks.find((item) => item.id === starter.id)
      if (!week || week.slug !== starter.slug) return structuredClone(starter)
      return {
        ...week,
        summary: week.summary || starter.summary || '',
        study: week.study || starter.study || { definitions: [], questions: [] },
        status: week.status,
      }
    })
  } catch { return structuredClone(starterWeeks) }
}

export function saveWeeks(value: Week[]) { localStorage.setItem(STORE, JSON.stringify(value)) }

export function loadRevisions(): Revision[] {
  try { return JSON.parse(localStorage.getItem(REVISION_STORE) || '[]') as Revision[] } catch { return [] }
}

export function saveRevision(revision: Revision) {
  const all = loadRevisions()
  localStorage.setItem(REVISION_STORE, JSON.stringify([revision, ...all].slice(0, 50)))
}
