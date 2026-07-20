import type {
  Certification,
  DocumentType,
  Education,
  Experience,
  Interest,
  ResumeSnapshot,
  Skill,
  TemplateSlug,
} from '@profiloz/shared'
import { defineStore } from 'pinia'
import { isBase64PhotoUrl, templatePhotoDefault } from '@profiloz/shared'
import { calculateCompleteness } from '~/utils/completeness'
import { stripLegacyBase64Photo } from '~/utils/photoUrl'
import { clearLegacyResumeDraft, createScopedResumeDraftStorage } from '~/utils/resume-draft-storage'
import { createAminataDemoResume } from '~/features/demo/aminata-persona'
import { isLocalDemoResumeId } from '~/utils/resume-id'
import { createRandomId } from '~/utils/random-id'
import { cvTemplateAccentColors, defaultCvTemplateConfig } from '~/utils/template-accent-colors'

function createEmptyResume(): ResumeSnapshot {
  return {
    id: createRandomId(),
    title: 'Mon CV',
    templateSlug: 'PROFESSIONNEL',
    templateConfig: {
      ...defaultCvTemplateConfig('PROFESSIONNEL'),
      showPhoto: templatePhotoDefault('PROFESSIONNEL'),
    },
    personalInfo: {},
    experiences: [],
    educations: [],
    skills: [],
    certifications: [],
    interests: [],
    languages: [],
    metadata: {
      completeness: 0,
      lastModified: new Date().toISOString(),
      source: 'wizard',
    },
  }
}

function touch(resume: ResumeSnapshot) {
  resume.metadata.lastModified = new Date().toISOString()
  resume.metadata.completeness = calculateCompleteness(resume)
}

export const useResumeStore = defineStore('resume', {
  state: () => ({
    current: null as ResumeSnapshot | null,
    isDirty: false,
    savedResumeId: null as string | null,
  }),
  getters: {
    completeness: (state) => state.current?.metadata.completeness ?? 0,
  },
  actions: {
    initDraft() {
      if (!this.current) {
        this.current = createEmptyResume()
        this.savedResumeId = null
        this.isDirty = true
      }
    },
    loadSnapshot(snapshot: ResumeSnapshot) {
      this.current = { ...snapshot }
      this.savedResumeId = isLocalDemoResumeId(snapshot.id) ? null : snapshot.id
      this.isDirty = false
    },
    markSaved(snapshot: ResumeSnapshot) {
      this.current = snapshot
      this.savedResumeId = isLocalDemoResumeId(snapshot.id) ? null : snapshot.id
      this.isDirty = false
    },
    markDraftSynced() {
      this.isDirty = false
    },
    startNewDraft() {
      this.current = createEmptyResume()
      this.savedResumeId = null
      this.isDirty = false
    },
    loadDemoPersona() {
      const slug = this.current?.templateSlug ?? 'PROFESSIONNEL'
      const accent = cvTemplateAccentColors(slug).accent
      this.current = createAminataDemoResume(slug, accent)
      this.savedResumeId = null
      this.isDirty = true
    },
    ensureDemoPersonaIfEmpty() {
      this.rehydrateFromStorage()
      if (!this.current?.personalInfo.fullName?.trim()) {
        this.loadDemoPersona()
        return
      }
      this.initDraft()
    },
    rehydrateFromStorage() {
      if (!import.meta.client) return

      const raw = createScopedResumeDraftStorage().getItem('profiloz:resume:draft')
      if (!raw) return

      this.$reset()

      try {
        const persisted = JSON.parse(raw) as Partial<{
          current: ResumeSnapshot | null
          isDirty: boolean
          savedResumeId: string | null
        }>
        if (persisted.current !== undefined) this.current = persisted.current
        if (persisted.isDirty !== undefined) this.isDirty = persisted.isDirty
        if (persisted.savedResumeId !== undefined) {
          this.savedResumeId = isLocalDemoResumeId(persisted.savedResumeId)
            ? null
            : persisted.savedResumeId
        }
        if (this.current?.personalInfo.photoUrl && isBase64PhotoUrl(this.current.personalInfo.photoUrl)) {
          this.current.personalInfo.photoUrl = undefined
        }
      } catch {
        // ignore invalid persisted draft
      }
    },
    updatePersonalInfo(info: ResumeSnapshot['personalInfo']) {
      this.initDraft()
      if (this.current) {
        this.current.personalInfo = {
          ...this.current.personalInfo,
          ...info,
          photoUrl: stripLegacyBase64Photo(info.photoUrl),
        }
        touch(this.current)
        this.isDirty = true
      }
    },
    setSummary(summary: string) {
      this.initDraft()
      if (this.current) {
        this.current.summary = summary
        touch(this.current)
        this.isDirty = true
      }
    },
    setEducations(educations: Education[]) {
      this.initDraft()
      if (this.current) {
        this.current.educations = educations
        touch(this.current)
        this.isDirty = true
      }
    },
    setExperiences(experiences: Experience[]) {
      this.initDraft()
      if (this.current) {
        this.current.experiences = experiences
        touch(this.current)
        this.isDirty = true
      }
    },
    setSkills(skills: Skill[]) {
      this.initDraft()
      if (this.current) {
        this.current.skills = skills
        touch(this.current)
        this.isDirty = true
      }
    },
    setCertifications(certifications: Certification[]) {
      this.initDraft()
      if (this.current) {
        this.current.certifications = certifications
        touch(this.current)
        this.isDirty = true
      }
    },
    setInterests(interests: Interest[]) {
      this.initDraft()
      if (this.current) {
        this.current.interests = interests
        touch(this.current)
        this.isDirty = true
      }
    },
    setTemplate(slug: TemplateSlug) {
      this.initDraft()
      if (this.current) {
        const hasPhoto = Boolean(this.current.personalInfo?.photoUrl?.trim())
        const explicitShowPhoto = this.current.templateConfig.showPhoto
        const targetShowPhoto =
          explicitShowPhoto !== undefined
            ? explicitShowPhoto
            : hasPhoto
            ? true
            : templatePhotoDefault(slug)

        this.current.templateSlug = slug
        this.current.templateConfig = {
          ...this.current.templateConfig,
          accentColor: cvTemplateAccentColors(slug).accent,
          showPhoto: targetShowPhoto,
        }
        touch(this.current)
        this.isDirty = true
      }
    },
    setTemplateConfig(config: ResumeSnapshot['templateConfig']) {
      this.initDraft()
      if (this.current) {
        this.current.templateConfig = { ...this.current.templateConfig, ...config }
        touch(this.current)
        this.isDirty = true
      }
    },
    mergeImportedData(
      data: Partial<ResumeSnapshot>,
      options?: { documentType?: DocumentType; replace?: boolean },
    ) {
      const documentType = options?.documentType ?? 'CV'
      const replace = options?.replace ?? documentType === 'CV'

      if (replace) {
        const preservedTemplate = this.current?.templateSlug
        const preservedConfig = this.current?.templateConfig
        this.startNewDraft()
        if (preservedTemplate && this.current) {
          this.current.templateSlug = preservedTemplate
          if (preservedConfig) {
            this.current.templateConfig = { ...preservedConfig }
          }
        }
      } else {
        this.initDraft()
      }

      if (!this.current) return

      if (replace) {
        this.current.personalInfo = { ...(data.personalInfo ?? {}) }
        if (data.personalInfo?.photoUrl?.trim()) {
          this.current.templateConfig.showPhoto = true
        }
        this.current.summary = data.summary?.trim() || undefined
        this.current.title = data.title?.trim() || this.current.title
        this.current.experiences = (data.experiences ?? []).map((exp) => ({
          ...exp,
          location: exp.location?.trim() || data.personalInfo?.location?.trim() || '',
        }))
        this.current.educations = data.educations ?? []
        this.current.skills = data.skills ?? []
        this.current.certifications = data.certifications ?? []
        this.current.languages = data.languages ?? []
        this.current.interests = data.interests ?? []
      } else {
        if (data.personalInfo) {
          const merged = { ...this.current.personalInfo }
          for (const [key, value] of Object.entries(data.personalInfo)) {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              merged[key as keyof typeof merged] = value as never
            }
          }
          this.current.personalInfo = merged
        }

        const appendUnique = <T>(current: T[], incoming: T[] | undefined, key: (item: T) => string) => {
          if (!incoming?.length) return current
          const seen = new Set(current.map(key))
          return [...current, ...incoming.filter((item) => !seen.has(key(item)))]
        }

        this.current.experiences = appendUnique(
          this.current.experiences,
          data.experiences,
          (item) => `${item.company}|${item.position}`.toLowerCase(),
        )
        this.current.educations = appendUnique(
          this.current.educations,
          data.educations,
          (item) => `${item.institution}|${item.degree}`.toLowerCase(),
        )
        this.current.skills = appendUnique(this.current.skills, data.skills, (item) => item.name.toLowerCase())
        this.current.certifications = appendUnique(
          this.current.certifications,
          data.certifications,
          (item) => item.name.toLowerCase(),
        )
        this.current.languages = appendUnique(
          this.current.languages,
          data.languages,
          (item) => item.name.toLowerCase(),
        )
        this.current.interests = appendUnique(
          this.current.interests,
          data.interests,
          (item) => item.name.toLowerCase(),
        )
      }

      this.current.metadata.source = 'import'
      touch(this.current)
      this.isDirty = true
    },
  },
  persist: {
    key: 'profiloz:resume:draft',
    storage: createScopedResumeDraftStorage(),
  },
})
