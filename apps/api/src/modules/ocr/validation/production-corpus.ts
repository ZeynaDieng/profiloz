/**
 * Rapport de validation production — pipeline complet sur fichiers binaires réels.
 */
import type { DocumentValidation, AggregateValidationReport } from './real-corpus'
import type { ImportUxReport } from './import-ux-checks'

export interface ProductionDocumentValidation extends DocumentValidation {
  mimeType: string
  isBinary: boolean
  pipelineMs: number
  ux: ImportUxReport
}

export interface ProductionValidationReport extends Omit<AggregateValidationReport, 'documents' | 'problematicCases'> {
  binaryDocuments: number
  textDocuments: number
  overallUxScore: number
  binaryOnlyRate: number
  documents: ProductionDocumentValidation[]
  problematicCases: ProductionDocumentValidation[]
}

export function aggregateProductionReport(
  documents: ProductionDocumentValidation[],
): ProductionValidationReport {
  const binaryDocs = documents.filter((d) => d.isBinary)
  const textDocs = documents.filter((d) => !d.isBinary)

  const base = {
    generatedAt: new Date().toISOString(),
    documentsTotal: documents.length,
    documentsWithGroundTruth: documents.filter((d) => d.total > 0).length,
    byCategory: {} as ProductionValidationReport['byCategory'],
    overallRate: 0,
    documents,
    tagBreakdown: {} as ProductionValidationReport['tagBreakdown'],
    hardestCategories: [] as ProductionValidationReport['hardestCategories'],
    problematicCases: documents.filter((d) => d.rate < 0.75).sort((a, b) => a.rate - b.rate),
    knownLimits: [
      'Corpus production encore incomplet — déposez vos PDF/DOCX/images dans cv-samples/production/files/.',
      'CV très graphiques (Canva / Adobe) avec peu de texte sélectionnable.',
      'PDF scannés de faible qualité, inclinés ou peu contrastés.',
      'Photos mobile avec reflets ou cadrage serré.',
      'Mises en page 3–4 colonnes atypiques.',
    ],
    improvementPaths: [
      'Enrichir cv-samples/production/ avec des fichiers anonymisés par format (Canva, Word, Europass, scans).',
      'Annoter chaque fichier dans ground-truth/ pour mesurer l’exactitude champ par champ.',
      'Analyser les corrections utilisateur (ImportFeedback) pour prioriser les extracteurs.',
      'Renforcer le prétraitement OCR (inclinaison, binarisation adaptative).',
    ],
    binaryDocuments: binaryDocs.length,
    textDocuments: textDocs.length,
    overallUxScore: documents.length
      ? documents.reduce((s, d) => s + d.ux.score, 0) / documents.length
      : 0,
    binaryOnlyRate: binaryDocs.length
      ? binaryDocs.reduce((s, d) => s + d.rate, 0) / binaryDocs.length
      : 0,
  }

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
  for (const [category, { correct, total }] of byCategory.entries()) {
    base.byCategory[category] = { correct, total, rate: total ? correct / total : 0 }
  }

  const tagBreakdown: ProductionValidationReport['tagBreakdown'] = {}
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
  base.tagBreakdown = tagBreakdown

  const overallCorrect = documents.reduce((s, d) => s + d.correct, 0)
  const overallTotal = documents.reduce((s, d) => s + d.total, 0)
  base.overallRate = overallTotal ? overallCorrect / overallTotal : 0
  base.hardestCategories = Object.entries(base.byCategory)
    .map(([category, { rate }]) => ({ category, rate }))
    .sort((a, b) => a.rate - b.rate)

  return base as ProductionValidationReport
}

export function formatProductionReportMarkdown(report: ProductionValidationReport): string {
  const lines: string[] = [
    '# Rapport validation production — Import OCR Profilo\'Z',
    '',
    `Généré le ${report.generatedAt}`,
    '',
    '## Synthèse pipeline complet (Document → OCR → Parsing → Fusion)',
    '',
    `- **Documents testés** : ${report.documentsTotal} (${report.binaryDocuments} binaires, ${report.textDocuments} texte)`,
    `- **Taux exactitude (ground truth)** : ${(report.overallRate * 100).toFixed(1)} %`,
    `- **Taux binaires seuls** : ${(report.binaryOnlyRate * 100).toFixed(1)} %`,
    `- **Score UX post-parsing** : ${report.overallUxScore.toFixed(1)} %`,
    '',
    '## Checklist UX (préremplissage)',
    '',
    '| Contrôle | Taux de réussite |',
    '|----------|------------------|',
  ]

  const uxTotals = new Map<string, { pass: number; total: number }>()
  for (const doc of report.documents) {
    for (const check of doc.ux.checks) {
      const row = uxTotals.get(check.id) ?? { pass: 0, total: 0 }
      row.total += 1
      if (check.passed) row.pass += 1
      uxTotals.set(check.id, row)
    }
  }
  for (const [id, { pass, total }] of uxTotals.entries()) {
    const sample = report.documents[0]?.ux.checks.find((c) => c.id === id)
    lines.push(`| ${sample?.label ?? id} | ${total ? ((pass / total) * 100).toFixed(0) : '—'} % |`)
  }

  lines.push('', '## Taux par catégorie (ground truth)', '')
  lines.push('| Catégorie | Taux | Détail |', '|-----------|------|--------|')
  for (const [cat, { rate, correct, total }] of Object.entries(report.byCategory)) {
    lines.push(`| ${cat} | ${(rate * 100).toFixed(1)} % | ${correct}/${total} |`)
  }

  lines.push('', '## Répartition par format', '')
  for (const [tag, { count, rate }] of Object.entries(report.tagBreakdown)) {
    lines.push(`- **${tag}** : ${count} CV — ${(rate * 100).toFixed(1)} %`)
  }

  if (report.problematicCases.length) {
    lines.push('', '## Cas problématiques (< 75 % exactitude)', '')
    for (const doc of report.problematicCases.slice(0, 15)) {
      lines.push(`### ${doc.id} — ${doc.file} (${(doc.rate * 100).toFixed(0)} %, UX ${doc.ux.score} %)`)
      const uxFails = doc.ux.checks.filter((c) => !c.passed)
      for (const c of uxFails) {
        lines.push(`- UX **${c.label}** : ${c.detail ?? 'échec'}`)
      }
      lines.push('')
    }
  }

  lines.push('## Critère « moteur prêt »', '')
  lines.push(
    '- Exactitude ≥ 85 % sur le corpus production binaire annoté',
    '- Score UX ≥ 90 % sur les mêmes documents',
    '- Aucun format majeur (PDF Word, DOCX, scan) sous 75 %',
    '- Parcours utilisateur validé manuellement (ImportReview → éditeur → PDF final)',
  )

  lines.push('', '## Limites connues', '')
  for (const limit of report.knownLimits) lines.push(`- ${limit}`)

  lines.push('', '## Pistes d’amélioration', '')
  for (const path of report.improvementPaths) lines.push(`- ${path}`)

  lines.push('')
  return lines.join('\n')
}
