import type {
  Certification,
  DocumentType,
  Education,
  Experience,
  Interest,
  Language,
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
        this.rehydrateFromStorage()
      }
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
      if (import.meta.client) {
        try {
          createScopedResumeDraftStorage().removeItem('profiloz:resume:draft')
        } catch {}
      }
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
      this.initDraft()
    },
    rehydrateFromStorage() {
      if (!import.meta.client) return
      if (this.current) return

      const raw = createScopedResumeDraftStorage().getItem('profiloz:resume:draft')
      if (!raw) return

      try {
        const persisted = JSON.parse(raw) as Partial<{
          current: ResumeSnapshot | null
          isDirty: boolean
          savedResumeId: string | null
        }>
        if (persisted.current) this.current = persisted.current
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
    setLanguages(languages: Language[]) {
      this.initDraft()
      if (this.current) {
        this.current.languages = languages
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

      const rawAny = data as any
      const rawPi = data.personalInfo ?? rawAny.contact ?? rawAny.info ?? {}
      const fullName = String(rawPi.fullName || rawPi.name || rawAny.fullName || rawAny.name || '').trim()
      const jobTitle = String(rawPi.jobTitle || rawPi.title || rawAny.jobTitle || rawAny.title || '').trim()
      const email = String(rawPi.email || rawAny.email || '').trim()
      const phone = String(rawPi.phone || rawPi.phoneNumber || rawAny.phone || rawAny.phoneNumber || '').trim()
      const location = String(rawPi.location || rawPi.address || rawAny.location || rawAny.address || '').trim()
      const linkedinUrl = String(rawPi.linkedinUrl || rawPi.linkedin || rawAny.linkedinUrl || rawAny.linkedin || '').trim()
      const websiteUrl = String(rawPi.websiteUrl || rawPi.website || rawAny.websiteUrl || rawAny.website || '').trim()
      const photoUrl = (rawPi.photoUrl || rawAny.photoUrl)?.trim() || undefined

      const normalizedPi = {
        fullName: fullName || undefined,
        jobTitle: jobTitle || undefined,
        email: email || undefined,
        phone: phone || undefined,
        location: location || undefined,
        linkedinUrl: linkedinUrl || undefined,
        websiteUrl: websiteUrl || undefined,
        photoUrl: photoUrl || undefined,
      }

      const summaryText = String(
        data.summary || rawPi.summary || rawAny.profile || rawAny.about || rawAny.objective || rawAny.overview || '',
      ).trim()

      const rawExp = data.experiences ?? rawAny.workExperience ?? rawAny.experience ?? rawAny.history ?? rawAny.parcours ?? []
      const rawEdu = data.educations ?? rawAny.education ?? rawAny.formation ?? rawAny.formations ?? rawAny.studies ?? []
      const rawSkills = data.skills ?? rawAny.competences ?? rawAny.skillList ?? rawAny.expertise ?? []
      const rawCerts = data.certifications ?? rawAny.certifs ?? rawAny.certificationList ?? []
      const rawLangs = data.languages ?? rawAny.langues ?? rawAny.languageList ?? []
      const rawInterests = data.interests ?? rawAny.centresDInteret ?? rawAny.hobbies ?? rawAny.interestList ?? []

      const normalizedExp = rawExp
        .map((exp: any) => {
          if (!exp || typeof exp !== 'object') return null
          const position = String(exp.position || exp.title || exp.jobTitle || '').trim()
          const company = String(exp.company || exp.employer || exp.organization || '').trim()
          if (!position && !company) return null
          return {
            ...exp,
            position: position || 'Poste',
            company: company || 'Entreprise',
            location: String(exp.location || normalizedPi.location || '').trim(),
            startDate: exp.startDate ? String(exp.startDate).trim() : undefined,
            endDate: exp.endDate ? String(exp.endDate).trim() : undefined,
            isCurrent: Boolean(exp.isCurrent),
            description: exp.description ? String(exp.description).trim() : undefined,
          }
        })
        .filter(Boolean)

      const normalizedEdu = rawEdu
        .map((edu: any) => {
          if (!edu || typeof edu !== 'object') return null
          const degree = String(edu.degree || edu.diploma || edu.title || '').trim()
          const institution = String(edu.institution || edu.school || edu.university || '').trim()
          if (!degree && !institution) return null
          return {
            ...edu,
            degree: degree || 'Diplôme',
            institution: institution || 'Établissement',
            location: edu.location ? String(edu.location).trim() : undefined,
            startDate: edu.startDate ? String(edu.startDate).trim() : undefined,
            endDate: edu.endDate ? String(edu.endDate).trim() : undefined,
            field: edu.field ? String(edu.field).trim() : undefined,
          }
        })
        .filter(Boolean)

      const normalizedSkills = rawSkills
        .map((item: any) => {
          if (!item) return null
          if (typeof item === 'string') {
            const name = item.trim()
            return name ? { name } : null
          }
          const name = String(item.name || item.skill || item.label || item.value || '').trim()
          if (!name) return null
          return {
            ...item,
            name,
            level: item.level ? String(item.level).trim() : undefined,
          }
        })
        .filter(Boolean)

      const normalizedCerts = rawCerts
        .map((item: any) => {
          if (!item) return null
          if (typeof item === 'string') {
            const name = item.trim()
            return name ? { name } : null
          }
          const name = String(item.name || item.title || item.label || '').trim()
          if (!name) return null
          return {
            ...item,
            name,
            issuer: item.issuer ? String(item.issuer).trim() : undefined,
            date: item.date ? String(item.date).trim() : undefined,
          }
        })
        .filter(Boolean)

      const normalizedLangs = rawLangs
        .map((item: any) => {
          if (!item) return null
          if (typeof item === 'string') {
            const name = item.trim()
            return name ? { name } : null
          }
          const name = String(item.name || item.language || item.label || item.value || '').trim()
          if (!name) return null
          return { ...item, name, level: item.level ? String(item.level).trim() : undefined }
        })
        .filter(Boolean)

      const normalizedInterests = rawInterests
        .map((item: any) => {
          if (!item) return null
          if (typeof item === 'string') {
            const name = item.trim()
            return name ? { name } : null
          }
          const name = String(item.name || item.label || item.title || item.interest || item.value || '').trim()
          if (!name) return null
          return { ...item, name }
        })
        .filter(Boolean)

      if (replace) {
        this.current.personalInfo = normalizedPi
        if (normalizedPi.photoUrl) {
          this.current.templateConfig.showPhoto = true
        }
        this.current.summary = summaryText || undefined
        this.current.title = data.title?.trim() || (normalizedPi.fullName ? `CV — ${normalizedPi.fullName}` : this.current.title)
        this.current.experiences = normalizedExp
        this.current.educations = normalizedEdu
        this.current.skills = normalizedSkills
        this.current.certifications = normalizedCerts
        this.current.languages = normalizedLangs
        this.current.interests = normalizedInterests
      } else {
        if (data.personalInfo || rawAny.contact || rawAny.info) {
          const merged = { ...this.current.personalInfo }
          for (const [key, value] of Object.entries(normalizedPi)) {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              merged[key as keyof typeof merged] = value as never
            }
          }
          this.current.personalInfo = merged
        }

        const appendUnique = <T>(current: T[], incoming: T[], key: (item: T) => string) => {
          if (!incoming.length) return current
          const seen = new Set(current.map(key))
          return [...current, ...incoming.filter((item) => !seen.has(key(item)))]
        }

        this.current.experiences = appendUnique(
          this.current.experiences,
          normalizedExp,
          (item) => `${item.company}|${item.position}`.toLowerCase(),
        )
        this.current.educations = appendUnique(
          this.current.educations,
          normalizedEdu,
          (item) => `${item.institution}|${item.degree}`.toLowerCase(),
        )
        this.current.skills = appendUnique(
          this.current.skills,
          normalizedSkills,
          (item) => item.name.toLowerCase(),
        )
        this.current.certifications = appendUnique(
          this.current.certifications,
          normalizedCerts,
          (item) => item.name.toLowerCase(),
        )
        this.current.languages = appendUnique(
          this.current.languages,
          normalizedLangs,
          (item) => String(item.name || '').toLowerCase(),
        )
        this.current.interests = appendUnique(
          this.current.interests,
          normalizedInterests,
          (item) => String(item.name || '').toLowerCase(),
        )
      }

      this.current.metadata.source = 'import'
      touch(this.current)
      this.isDirty = true

      if (import.meta.client && this.current) {
        try {
          const raw = JSON.stringify({ current: this.current, savedResumeId: this.savedResumeId })
          createScopedResumeDraftStorage().setItem('profiloz:resume:draft', raw)
        } catch {
          // ignore
        }
      }
      console.log('💾 [Profilo’Z Store] État du store après fusion :', this.current)
    },
  },
  persist: {
    key: 'profiloz:resume:draft',
    storage: createScopedResumeDraftStorage(),
  },
})
