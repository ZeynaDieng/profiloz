import { TEMPLATE_SLUGS, WIZARD_STEPS } from '../constants.js'

export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number]

export type WizardStep = (typeof WIZARD_STEPS)[number]

export type DocumentType = 'CV' | 'DIPLOMA' | 'CERTIFICATE'

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'FAILED'

export type ResumeStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export type LanguageLevel = 'BASIC' | 'CONVERSATIONAL' | 'PROFESSIONAL' | 'NATIVE'

export interface PersonalInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  jobTitle?: string
  linkedinUrl?: string
  websiteUrl?: string
  photoUrl?: string
}

export interface Experience {
  id?: string
  company: string
  position: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  description?: string
  sortOrder?: number
}

export interface Education {
  id?: string
  institution: string
  degree: string
  field?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  sortOrder?: number
}

export interface Skill {
  id?: string
  name: string
  level?: SkillLevel
  category?: string
  sortOrder?: number
}

export interface Certification {
  id?: string
  name: string
  issuer?: string
  issueDate?: string
  expiryDate?: string
  credentialId?: string
  sortOrder?: number
}

export interface Interest {
  id?: string
  name: string
  sortOrder?: number
}

export interface Language {
  id?: string
  name: string
  level?: LanguageLevel
  sortOrder?: number
}

export interface TemplateConfig {
  accentColor?: string
  margins?: number
  lineHeight?: number
  typography?: string
}

export interface ResumeMetadata {
  completeness: number
  lastModified: string
  source: 'wizard' | 'import' | 'manual'
}

export interface ResumeSnapshot {
  id: string
  title: string
  templateSlug: TemplateSlug
  templateConfig: TemplateConfig
  personalInfo: PersonalInfo
  summary?: string
  experiences: Experience[]
  educations: Education[]
  skills: Skill[]
  certifications: Certification[]
  interests: Interest[]
  languages: Language[]
  metadata: ResumeMetadata
}

export interface TemplateDefinition {
  slug: TemplateSlug
  name: string
  category: string
  description?: string
  previewUrl: string
  supportedSections: string[]
}

export interface ApiError {
  type: string
  title: string
  status: number
  detail?: string
  errors?: Array<{ field: string; message: string }>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
}
