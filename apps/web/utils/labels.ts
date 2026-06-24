export const MISSING_SECTION_LABELS: Record<string, string> = {
  informations: 'Compléter vos informations personnelles',
  formation: 'Ajouter une formation',
  experience: 'Ajouter une expérience professionnelle',
  competences: 'Ajouter une compétence',
  certifications: 'Ajouter une certification',
  summary: 'Rédiger un résumé professionnel',
}

export function getSectionLabel(section: string) {
  return MISSING_SECTION_LABELS[section] ?? section
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CV: 'CV',
  DIPLOMA: 'Diplôme',
  CERTIFICATE: 'Attestation',
}

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  UPLOADED: 'Téléversé',
  PROCESSING: 'En cours',
  PARSED: 'Analysé',
  FAILED: 'Échec',
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
