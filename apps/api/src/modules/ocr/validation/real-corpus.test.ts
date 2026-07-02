import { describe, expect, it } from 'vitest'
import { runResumePipeline } from '../pipeline'
import {
  aggregateValidationReport,
  formatValidationReportMarkdown,
  validateAgainstGroundTruth,
  type RealCvGroundTruth,
} from './real-corpus'

const sampleGt: RealCvGroundTruth = {
  id: 'test-classique',
  file: 'files/test.txt',
  tags: { source: 'txt', language: 'fr', columns: 1 },
  identity: { fullName: 'Camille Durand', jobTitle: 'Cheffe de projet digital' },
  contact: { email: 'camille.durand@example.com' },
  experiences: [{ position: 'Cheffe de projet digital', company: 'Agence Pixel' }],
  skills: ['Agile', 'Scrum'],
  languages: [{ name: 'Français' }],
}

const sampleText = `
Camille Durand
Cheffe de projet digital
camille.durand@example.com — 06 12 34 56 78 — Lyon

Expérience professionnelle
Cheffe de projet digital — Agence Pixel, Lyon
2019 - 2022

Compétences
Gestion de projet, Agile, Scrum, SEO

Langues
Français, Anglais
`

describe('validateAgainstGroundTruth', () => {
  it('marque les champs correctement détectés', async () => {
    const parsed = await runResumePipeline(sampleText)
    const result = validateAgainstGroundTruth(sampleGt, parsed, {
      ocrConfidence: 0.95,
      qualityFlags: [],
      orphanLines: [],
      warnings: [],
      errors: [],
    })

    expect(result.correct).toBeGreaterThan(0)
    expect(result.fields.some((f) => f.category === 'identité' && f.field === 'fullName' && f.status === 'correct')).toBe(true)
    expect(result.fields.some((f) => f.category === 'coordonnées' && f.field === 'email' && f.status === 'correct')).toBe(true)
  })

  it('agrège un rapport markdown', async () => {
    const parsed = await runResumePipeline(sampleText)
    const doc = validateAgainstGroundTruth(sampleGt, parsed, {
      ocrConfidence: 0.9,
      qualityFlags: [],
      orphanLines: [],
      warnings: [],
      errors: [],
    })
    const report = aggregateValidationReport([doc])
    const md = formatValidationReportMarkdown(report)

    expect(report.documentsTotal).toBe(1)
    expect(md).toContain('Rapport de validation terrain')
    expect(md).toContain('identité')
  })
})
