import type { ResumeSnapshot } from '@profiloz/shared'
import { filterCompleteEducations } from '~/utils/education'
import { filterCompleteExperiences } from '~/utils/experience'

function hasText(value: string | undefined | null): value is string {
  return Boolean(value?.trim())
}

export type SaveResumePayload = {
  title: string
  templateSlug: ResumeSnapshot['templateSlug']
  templateConfig: ResumeSnapshot['templateConfig']
  personalInfo: ResumeSnapshot['personalInfo']
  summary?: string
  experiences: ResumeSnapshot['experiences']
  educations: ResumeSnapshot['educations']
  skills: ResumeSnapshot['skills']
  certifications: ResumeSnapshot['certifications']
  interests: ResumeSnapshot['interests']
  languages: ResumeSnapshot['languages']
}

export function toSavePayload(snapshot: ResumeSnapshot): SaveResumePayload {
  return {
    title: snapshot.title?.trim() || 'Mon CV',
    templateSlug: snapshot.templateSlug,
    templateConfig: snapshot.templateConfig,
    personalInfo: {
      ...snapshot.personalInfo,
      photoUrl: stripLegacyBase64Photo(snapshot.personalInfo.photoUrl),
    },
    summary: snapshot.summary,
    experiences: filterCompleteExperiences(snapshot.experiences).map(
      ({ company, position, location, startDate, endDate, isCurrent, description }) => ({
      company: company.trim(),
      position: position.trim(),
      location: location!.trim(),
      startDate: startDate!.trim(),
      endDate: isCurrent ? undefined : endDate?.trim(),
      isCurrent,
      description: description?.trim() || undefined,
    })),
    educations: filterCompleteEducations(snapshot.educations).map(
      ({ institution, degree, field, location, startDate, endDate, description }) => ({
      institution: institution.trim(),
      degree: degree.trim(),
      field: field!.trim(),
      location,
      startDate: startDate!.trim(),
      endDate: endDate!.trim(),
      description,
    })),
    skills: snapshot.skills
      .filter((item) => hasText(item.name))
      .map(({ name, level, category }) => ({ name: name.trim(), level, category })),
    certifications: snapshot.certifications
      .filter((item) => hasText(item.name))
      .map(({ name, issuer, issueDate, expiryDate, credentialId }) => ({
      name: name.trim(),
      issuer,
      issueDate,
      expiryDate,
      credentialId,
    })),
    interests: snapshot.interests
      .filter((item) => hasText(item.name))
      .map(({ name }) => ({ name: name.trim() })),
    languages: snapshot.languages
      .filter((item) => hasText(item.name))
      .map(({ name, level }) => ({ name: name.trim(), level })),
  }
}

export function useResumeService() {
  const { get, post, patch, delete: del } = useApiClient()

  async function listResumes() {
    return get<{
      data: Array<{
        id: string
        title: string
        status: string
        templateSlug: string
        completeness: number
        fullName?: string
        jobTitle?: string
        updatedAt: string
      }>
    }>('/resumes')
  }

  async function getById(id: string) {
    return get<ResumeSnapshot>(`/resumes/${id}`)
  }

  async function create(payload: SaveResumePayload) {
    return post<ResumeSnapshot>('/resumes', payload)
  }

  async function update(id: string, payload: SaveResumePayload) {
    return patch<ResumeSnapshot>(`/resumes/${id}`, payload)
  }

  async function rename(id: string, title: string) {
    return patch<{ id: string; title: string }>(`/resumes/${id}/title`, { title })
  }

  async function duplicate(id: string) {
    return post<ResumeSnapshot>(`/resumes/${id}/duplicate`)
  }

  async function archive(id: string) {
    await del(`/resumes/${id}`)
  }

  async function getCompleteness(id: string) {
    return get<{ score: number; missingSections: string[] }>(`/resumes/${id}/completeness`)
  }

  return { listResumes, getById, create, update, rename, duplicate, archive, getCompleteness, toSavePayload }
}
