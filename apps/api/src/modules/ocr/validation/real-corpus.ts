/**
 * Validation terrain : compare une extraction aux annotations manuelles (ground truth).
 */

import type { ResumeExtraction } from '../pipeline'

export type ValidationStatus = 'correct' | 'partial' | 'missing' | 'incorrect' | 'skipped'

export interface RealCvTags {
  tool?: 'canva' | 'word' | 'europass' | 'adobe' | 'photoshop' | 'indesign' | 'unknown'
  columns?: 1 | 2 | 3 | 4
  language?: 'fr' | 'en' | 'mixed'
  source?: 'pdf-text' | 'pdf-scanned' | 'docx' | 'jpg' | 'png' | 'phone-photo' | 'txt' | 'unknown'
  style?: 'modern' | 'classic'
}

export interface RealCvGroundTruth {
  id: string
  /** Fichier relatif à cv-samples/ */
  file: string
  tags: RealCvTags
  annotatedAt?: string
  annotatedBy?: string
  identity?: { fullName?: string; jobTitle?: string }
  contact?: { email?: string; phone?: string; location?: string; linkedinUrl?: string; websiteUrl?: string }
  summary?: string
  experiences?: Array<{
    position?: string
    company?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
  }>
  educations?: Array<{ degree?: string; institution?: string; field?: string }>
  skills?: string[]
  languages?: Array<{ name: string; level?: string }>
  certifications?: string[]
  interests?: string[]
  notes?: string
}

export interface FieldValidation {
  category: string
  field: string
  status: ValidationStatus
  expected?: string
  actual?: string
  detail?: string
}

export interface DocumentValidation {
  id: string
  file: string
  tags: RealCvTags
  ocrConfidence: number
  extractionConfidence: number
  fields: FieldValidation[]
  correct: number
  total: number
  rate: number
  qualityFlags: string[]
  orphanLines: string[]
  warnings: string[]
  errors: string[]
}

function norm(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchExpected(actual: string | undefined, expected: string | RegExp | undefined): ValidationStatus {
  if (expected === undefined) return 'skipped'
  if (!actual?.trim()) return 'missing'
  if (expected instanceof RegExp) return expected.test(actual) ? 'correct' : 'partial'
  const a = norm(actual)
  const e = norm(String(expected))
  if (a === e) return 'correct'
  if (a.includes(e) || e.includes(a)) return 'partial'
  return 'incorrect'
}

function matchList(actual: string[] | undefined, expected: string[] | undefined, label: string): FieldValidation[] {
  if (!expected?.length) return []
  const out: FieldValidation[] = []
  const got = (actual ?? []).map(norm)
  for (const item of expected) {
    const key = norm(item)
    const hit = got.some((g) => g === key || g.includes(key) || key.includes(g))
    out.push({
      category: label,
      field: item,
      status: hit ? 'correct' : 'missing',
      expected: item,
      actual: hit ? item : undefined,
    })
  }
  return out
}

export function validateAgainstGroundTruth(
  groundTruth: RealCvGroundTruth,
  extraction: ResumeExtraction,
  meta: { ocrConfidence: number; qualityFlags: string[]; orphanLines: string[]; warnings: string[]; errors: string[] },
): DocumentValidation {
  const fields: FieldValidation[] = []
  const p = extraction.personalInfo ?? {}

  const identityChecks: Array<[string, string | undefined, string | undefined]> = [
    ['fullName', p.fullName, groundTruth.identity?.fullName],
    ['jobTitle', p.jobTitle, groundTruth.identity?.jobTitle],
  ]
  for (const [field, actual, expected] of identityChecks) {
    const status = matchExpected(actual, expected)
    if (status !== 'skipped') {
      fields.push({ category: 'identité', field, status, expected: String(expected), actual })
    }
  }

  const contactChecks: Array<[string, string | undefined, string | undefined]> = [
    ['email', p.email, groundTruth.contact?.email],
    ['phone', p.phone, groundTruth.contact?.phone],
    ['location', p.location, groundTruth.contact?.location],
    ['linkedinUrl', p.linkedinUrl, groundTruth.contact?.linkedinUrl],
    ['websiteUrl', p.websiteUrl, groundTruth.contact?.websiteUrl],
  ]
  for (const [field, actual, expected] of contactChecks) {
    const status = matchExpected(actual, expected)
    if (status !== 'skipped') {
      fields.push({ category: 'coordonnées', field, status, expected: String(expected), actual })
    }
  }

  if (groundTruth.summary !== undefined) {
    fields.push({
      category: 'profil',
      field: 'summary',
      status: matchExpected(extraction.summary, groundTruth.summary),
      expected: groundTruth.summary,
      actual: extraction.summary,
    })
  }

  if (groundTruth.experiences?.length) {
    fields.push({
      category: 'expériences',
      field: 'count',
      status:
        (extraction.experiences?.length ?? 0) >= groundTruth.experiences.length
          ? 'correct'
          : (extraction.experiences?.length ?? 0) > 0
            ? 'partial'
            : 'missing',
      expected: String(groundTruth.experiences.length),
      actual: String(extraction.experiences?.length ?? 0),
    })
    for (let i = 0; i < groundTruth.experiences.length; i++) {
      const exp = groundTruth.experiences[i]!
      const got = extraction.experiences?.[i]
      if (exp.position) {
        fields.push({
          category: 'expériences',
          field: `[${i + 1}] poste`,
          status: matchExpected(got?.position, exp.position),
          expected: exp.position,
          actual: got?.position,
        })
      }
      if (exp.company) {
        fields.push({
          category: 'expériences',
          field: `[${i + 1}] entreprise`,
          status: matchExpected(got?.company, exp.company),
          expected: exp.company,
          actual: got?.company,
        })
      }
    }
  }

  if (groundTruth.educations?.length) {
    fields.push({
      category: 'formations',
      field: 'count',
      status:
        (extraction.educations?.length ?? 0) >= groundTruth.educations.length ? 'correct' : 'partial',
      expected: String(groundTruth.educations.length),
      actual: String(extraction.educations?.length ?? 0),
    })
  }

  fields.push(
    ...matchList(
      extraction.skills?.map((s) => s.name),
      groundTruth.skills,
      'compétences',
    ),
  )
  fields.push(
    ...matchList(
      extraction.languages?.map((l) => l.name),
      groundTruth.languages?.map((l) => l.name),
      'langues',
    ),
  )
  fields.push(
    ...matchList(
      extraction.certifications?.map((c) => c.name),
      groundTruth.certifications,
      'certifications',
    ),
  )
  fields.push(
    ...matchList(
      extraction.interests?.map((i) => i.name),
      groundTruth.interests,
      'centres d’intérêt',
    ),
  )

  const scored = fields.filter((f) => f.status !== 'skipped')
  const correct = scored.filter((f) => f.status === 'correct' || f.status === 'partial').length
  const total = scored.length

  return {
    id: groundTruth.id,
    file: groundTruth.file,
    tags: groundTruth.tags,
    ocrConfidence: meta.ocrConfidence,
    extractionConfidence: extraction._extraction.confidence.overall,
    fields,
    correct,
    total,
    rate: total ? correct / total : 0,
    qualityFlags: meta.qualityFlags,
    orphanLines: meta.orphanLines,
    warnings: meta.warnings,
    errors: meta.errors,
  }
}

export interface AggregateValidationReport {
  generatedAt: string
  documentsTotal: number
  documentsWithGroundTruth: number
  byCategory: Record<string, { correct: number; total: number; rate: number }>
  overallRate: number
  documents: DocumentValidation[]
  tagBreakdown: Record<string, { count: number; rate: number }>
  hardestCategories: Array<{ category: string; rate: number }>
  problematicCases: DocumentValidation[]
  knownLimits: string[]
  improvementPaths: string[]
}

export function aggregateValidationReport(documents: DocumentValidation[]): AggregateValidationReport {
  const byCategory = new Map<string, { correct: number; total: number }>()
  for (const doc of documents) {
    for (const field of doc.fields) {
      if (field.status === 'skipped') continue
      const row = byCategory.get(field.category) ?? { correct: 0, total: 0 }
      row.total += 1
      if (field.status === 'correct' || field.status === 'partial') row.correct += 1
      byCategory.set(field.category, row)
    }
  }

  const byCategoryOut: AggregateValidationReport['byCategory'] = {}
  for (const [category, { correct, total }] of byCategory.entries()) {
    byCategoryOut[category] = { correct, total, rate: total ? correct / total : 0 }
  }

  const tagBreakdown: Record<string, { count: number; rate: number }> = {}
  for (const doc of documents) {
    const tag = doc.tags.source ?? doc.tags.tool ?? 'unknown'
    const row = tagBreakdown[tag] ?? { count: 0, rate: 0 }
    row.count += 1
    row.rate += doc.rate
    tagBreakdown[tag] = row
  }
  for (const key of Object.keys(tagBreakdown)) {
    const row = tagBreakdown[key]!
    row.rate = row.count ? row.rate / row.count : 0
  }

  const overallCorrect = documents.reduce((s, d) => s + d.correct, 0)
  const overallTotal = documents.reduce((s, d) => s + d.total, 0)

  const hardestCategories = Object.entries(byCategoryOut)
    .map(([category, { rate }]) => ({ category, rate }))
    .sort((a, b) => a.rate - b.rate)

  return {
    generatedAt: new Date().toISOString(),
    documentsTotal: documents.length,
    documentsWithGroundTruth: documents.filter((d) => d.total > 0).length,
    byCategory: byCategoryOut,
    overallRate: overallTotal ? overallCorrect / overallTotal : 0,
    documents,
    tagBreakdown,
    hardestCategories,
    problematicCases: documents.filter((d) => d.rate < 0.75).sort((a, b) => a.rate - b.rate),
    knownLimits: [
      'CV très graphiques (Canva / Adobe) avec peu de texte sélectionnable.',
      'PDF scannés de faible qualité, inclinés ou peu contrastés.',
      'Photos mobile avec reflets ou cadrage serré.',
      'Mises en page 3–4 colonnes atypiques.',
      'Intitulés de poste sans mot-clé métier reconnu.',
    ],
    improvementPaths: [
      'Enrichir le corpus réel annoté (cv-samples/) — priorité aux formats sous-représentés.',
      'Affiner l’extracteur expériences sur les CV date-first et tableaux Europass.',
      'Renforcer le prétraitement OCR (inclinaison, binarisation adaptative).',
      'Étendre les dictionnaires métiers / compétences sectorielles.',
    ],
  }
}

export function formatValidationReportMarkdown(report: AggregateValidationReport): string {
  const lines: string[] = [
    '# Rapport de validation terrain — Import OCR Profilo\'Z',
    '',
    `Généré le ${report.generatedAt}`,
    '',
    '## Synthèse',
    '',
    `- **Documents testés** : ${report.documentsTotal}`,
    `- **Avec ground truth** : ${report.documentsWithGroundTruth}`,
    `- **Taux global** : ${(report.overallRate * 100).toFixed(1)} %`,
    '',
    '## Taux par catégorie',
    '',
    '| Catégorie | Taux | Détail |',
    '|-----------|------|--------|',
  ]

  for (const [cat, { rate, correct, total }] of Object.entries(report.byCategory)) {
    lines.push(`| ${cat} | ${(rate * 100).toFixed(1)} % | ${correct}/${total} |`)
  }

  lines.push('', '## Répartition par type de document', '')
  for (const [tag, { count, rate }] of Object.entries(report.tagBreakdown)) {
    lines.push(`- **${tag}** : ${count} CV — ${(rate * 100).toFixed(1)} %`)
  }

  lines.push('', '## Catégories les plus difficiles', '')
  for (const { category, rate } of report.hardestCategories.slice(0, 5)) {
    lines.push(`- ${category} : ${(rate * 100).toFixed(1)} %`)
  }

  if (report.problematicCases.length) {
    lines.push('', '## Cas problématiques (< 75 %)', '')
    for (const doc of report.problematicCases.slice(0, 15)) {
      lines.push(`### ${doc.id} — ${doc.file} (${(doc.rate * 100).toFixed(0)} %)`)
      const fails = doc.fields.filter((f) => f.status === 'incorrect' || f.status === 'missing')
      for (const f of fails.slice(0, 8)) {
        lines.push(`- **${f.category} / ${f.field}** [${f.status}] : attendu « ${f.expected ?? '—'} », obtenu « ${f.actual ?? '∅'} »`)
      }
      if (doc.qualityFlags.length) lines.push(`- Drapeaux : ${doc.qualityFlags.join(', ')}`)
      if (doc.orphanLines.length) lines.push(`- Infos non classées : ${doc.orphanLines.slice(0, 3).join(' | ')}`)
      lines.push('')
    }
  }

  lines.push('## Limites connues', '')
  for (const limit of report.knownLimits) lines.push(`- ${limit}`)

  lines.push('', '## Pistes d’amélioration', '')
  for (const path of report.improvementPaths) lines.push(`- ${path}`)

  lines.push('')
  return lines.join('\n')
}
