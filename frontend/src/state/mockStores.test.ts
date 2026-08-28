import { describe, expect, it } from 'vitest'
import { templateDraftStore } from '@/state/mockStores'

describe('templateDraftStore', () => {
  it('creates a blank draft that appears in the template snapshot', () => {
    const draft = templateDraftStore.createBlank()

    expect(draft.id.startsWith('tpl-draft-')).toBe(true)
    expect(draft.title).toBe('')
    expect(draft.sections).toHaveLength(0)
    expect(templateDraftStore.snapshot().some(template => template.id === draft.id)).toBe(true)
  })
})
