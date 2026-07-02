import type { ResumeSnapshot, TemplateSlug } from './types/index.js'

/** Modèles conçus avec un emplacement photo dès l'origine. */
const TEMPLATES_WITH_PHOTO_SLOT = new Set<TemplateSlug>([
  'PROFESSIONNEL',
  'MODERNE',
  'EXECUTIF',
  'CADRE',
  'CREATIF',
  'INTERNATIONAL',
])

export function templatePhotoDefault(slug: TemplateSlug): boolean {
  return TEMPLATES_WITH_PHOTO_SLOT.has(slug)
}

export function resolveShowPhoto(snapshot: ResumeSnapshot | null | undefined): boolean {
  if (!snapshot) return true
  const explicit = snapshot.templateConfig.showPhoto
  if (explicit !== undefined) return explicit
  return templatePhotoDefault(snapshot.templateSlug)
}
