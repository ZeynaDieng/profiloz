import type {
  Certification,
  Education,
  Experience,
  Interest,
  ResumeSnapshot,
  Skill,
  TemplateSlug,
} from '@profiloz/shared'
import { defineStore } from 'pinia'
import { calculateCompleteness } from '~/utils/completeness'

function createEmptyResume(): ResumeSnapshot {
  return {
    id: crypto.randomUUID(),
    title: 'Mon CV',
    templateSlug: 'PROFESSIONNEL',
    templateConfig: {},
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
      this.savedResumeId = snapshot.id
      this.isDirty = false
    },
    markSaved(snapshot: ResumeSnapshot) {
      this.current = snapshot
      this.savedResumeId = snapshot.id
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
    updatePersonalInfo(info: ResumeSnapshot['personalInfo']) {
      this.initDraft()
      if (this.current) {
        this.current.personalInfo = { ...this.current.personalInfo, ...info }
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
        this.current.templateSlug = slug
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
    mergeImportedData(data: Partial<ResumeSnapshot>) {
      this.initDraft()
      if (!this.current) return
      if (data.personalInfo) {
        this.current.personalInfo = { ...this.current.personalInfo, ...data.personalInfo }
      }
      if (data.educations?.length) {
        this.current.educations = [...this.current.educations, ...data.educations]
      }
      if (data.experiences?.length) {
        this.current.experiences = [...this.current.experiences, ...data.experiences]
      }
      if (data.skills?.length) {
        this.current.skills = [...this.current.skills, ...data.skills]
      }
      if (data.certifications?.length) {
        this.current.certifications = [...this.current.certifications, ...data.certifications]
      }
      this.current.metadata.source = 'import'
      touch(this.current)
      this.isDirty = true
    },
  },
  persist: {
    key: 'profiloz:resume:draft',
  },
})
