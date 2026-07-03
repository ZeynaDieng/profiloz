import { defineStore } from 'pinia'
import type { CoverLetterSnapshot, CoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { DEFAULT_LETTER_CONTENT } from '~/features/cover-letter-templates/registry'
import { createScopedCoverLetterDraftStorage } from '~/utils/cover-letter-draft-storage'
import { coverLetterDraftFromResume } from '~/features/demo/aminata-persona'
import type { ResumeSnapshot } from '@profiloz/shared'
import { createRandomId } from '~/utils/random-id'
import { defaultLetterAccentColor } from '~/utils/template-accent-colors'

export interface CoverLetterDraft {
  id: string
  templateSlug: CoverLetterTemplateSlug
  senderName: string
  senderEmail: string
  senderPhone: string
  senderLocation: string
  companyName: string
  companyAddress: string
  position: string
  recruiterName: string
  content: string
  closingText: string
  accentColor: string
  lastModified: string
}

function createEmptyDraft(): CoverLetterDraft {
  return {
    id: createRandomId(),
    templateSlug: 'CLASSIQUE',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    senderLocation: '',
    companyName: '',
    companyAddress: '',
    position: '',
    recruiterName: '',
    content: DEFAULT_LETTER_CONTENT,
    closingText: DEFAULT_CLOSING_TEXT,
    accentColor: defaultLetterAccentColor('CLASSIQUE'),
    lastModified: new Date().toISOString(),
  }
}

function touch(draft: CoverLetterDraft) {
  draft.lastModified = new Date().toISOString()
}

export const useCoverLetterStore = defineStore('coverLetter', {
  state: () => ({
    current: null as CoverLetterDraft | null,
    isDirty: false,
  }),
  actions: {
    initDraft() {
      if (!this.current) {
        this.current = createEmptyDraft()
        this.isDirty = true
      }
    },
    startNewDraft() {
      this.current = createEmptyDraft()
      this.isDirty = false
    },
    loadDemoPersona(resume?: ResumeSnapshot | null) {
      this.current = coverLetterDraftFromResume(resume)
      this.isDirty = false
    },
    ensureDemoPersonaIfEmpty(resume?: ResumeSnapshot | null) {
      this.rehydrateFromStorage()
      const hasContent = Boolean(this.current?.senderName?.trim() || this.current?.content?.trim())
      if (!hasContent) {
        this.loadDemoPersona(resume)
        return
      }
      this.initDraft()
    },
    rehydrateFromStorage() {
      if (!import.meta.client) return

      const raw = createScopedCoverLetterDraftStorage().getItem('profiloz:cover-letter:draft')
      if (!raw) return

      try {
        const persisted = JSON.parse(raw) as Partial<{
          current: CoverLetterDraft | null
          isDirty: boolean
        }>
        if (persisted.current !== undefined) {
          this.current = persisted.current
          if (this.current && !this.current.accentColor) {
            this.current.accentColor = defaultLetterAccentColor(this.current.templateSlug)
          }
        }
        if (persisted.isDirty !== undefined) this.isDirty = persisted.isDirty
      } catch {
        // ignore invalid persisted draft
      }
    },
    markDraftSynced() {
      this.isDirty = false
    },
    setTemplate(slug: CoverLetterTemplateSlug) {
      this.initDraft()
      if (this.current) {
        this.current.templateSlug = slug
        this.current.accentColor = defaultLetterAccentColor(slug)
        touch(this.current)
        this.isDirty = true
      }
    },
    patchFields(fields: Partial<Omit<CoverLetterDraft, 'id' | 'lastModified'>>) {
      this.initDraft()
      if (this.current) {
        Object.assign(this.current, fields)
        touch(this.current)
        this.isDirty = true
      }
    },
    applyImport(data: Partial<CoverLetterDraft>) {
      this.initDraft()
      if (!this.current) return
      if (data.senderName) this.current.senderName = data.senderName
      if (data.senderEmail) this.current.senderEmail = data.senderEmail
      if (data.senderPhone) this.current.senderPhone = data.senderPhone
      if (data.senderLocation) this.current.senderLocation = data.senderLocation
      if (data.companyName) this.current.companyName = data.companyName
      if (data.companyAddress) this.current.companyAddress = data.companyAddress
      if (data.position) this.current.position = data.position
      if (data.recruiterName) this.current.recruiterName = data.recruiterName
      if (data.content) this.current.content = data.content
      if (data.closingText) this.current.closingText = data.closingText
      if (data.templateSlug) this.current.templateSlug = data.templateSlug
      if (data.accentColor) this.current.accentColor = data.accentColor
      touch(this.current)
      this.isDirty = true
    },
    toSnapshot(): CoverLetterSnapshot | null {
      if (!this.current) return null
      return {
        templateSlug: this.current.templateSlug,
        senderName: this.current.senderName || undefined,
        senderEmail: this.current.senderEmail || undefined,
        senderPhone: this.current.senderPhone || undefined,
        senderLocation: this.current.senderLocation || undefined,
        companyName: this.current.companyName || undefined,
        companyAddress: this.current.companyAddress || undefined,
        position: this.current.position || undefined,
        recruiterName: this.current.recruiterName || undefined,
        content: this.current.content,
        closingText: this.current.closingText || undefined,
        accentColor: this.current.accentColor || undefined,
      }
    },
  },
  persist: {
    key: 'profiloz:cover-letter:draft',
    storage: createScopedCoverLetterDraftStorage(),
  },
})
