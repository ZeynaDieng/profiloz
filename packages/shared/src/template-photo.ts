import { getTemplateCatalogEntry, type TemplateSlug } from './templates.js'
import type { ResumeSnapshot } from './types/index.js'

/** Modèles conçus avec un emplacement photo dès l'origine (`photoSlot` du catalogue). */
export function templatePhotoDefault(slug: TemplateSlug): boolean {
  return getTemplateCatalogEntry(slug).photoSlot === true
}

export function resolveShowPhoto(snapshot: ResumeSnapshot | null | undefined): boolean {
  if (!snapshot) return true
  const explicit = snapshot.templateConfig.showPhoto
  // Respecter la désactivation explicite par l'utilisateur
  if (explicit === false) return false
  // Respecter l'activation explicite par l'utilisateur
  if (explicit === true) return true

  // Si le CV contient une photo de profil, elle est activée par défaut sur n'importe quel modèle choisi
  const hasPhoto = Boolean(snapshot.personalInfo?.photoUrl?.trim())
  if (hasPhoto) return true

  return templatePhotoDefault(snapshot.templateSlug)
}
