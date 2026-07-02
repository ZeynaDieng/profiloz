/**
 * Différences entre extraction machine et données corrigées par l'utilisateur.
 */
import type { ResumeSnapshot } from '@profiloz/shared'

export type ImportFeedbackFieldCategory =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skill'
  | 'language'
  | 'certification'
  | 'other'

export interface ImportFeedbackFieldDiff {
  path: string
  category: ImportFeedbackFieldCategory
  before: unknown
  after: unknown
  status: 'added' | 'removed' | 'changed' | 'unchanged'
}

type SnapshotLike = Partial<ResumeSnapshot>

function normStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function contactDiffs(before: SnapshotLike, after: SnapshotLike): ImportFeedbackFieldDiff[] {
  const fields: Array<{ key: keyof NonNullable<ResumeSnapshot['personalInfo']>; cat: ImportFeedbackFieldCategory }> = [
    { key: 'fullName', cat: 'contact' },
    { key: 'email', cat: 'contact' },
    { key: 'phone', cat: 'contact' },
    { key: 'location', cat: 'contact' },
    { key: 'jobTitle', cat: 'contact' },
    { key: 'linkedinUrl', cat: 'contact' },
    { key: 'websiteUrl', cat: 'contact' },
  ]
  const diffs: ImportFeedbackFieldDiff[] = []
  for (const { key, cat } of fields) {
    const b = normStr(before.personalInfo?.[key])
    const a = normStr(after.personalInfo?.[key])
    if (b === a) continue
    diffs.push({
      path: `personalInfo.${key}`,
      category: cat,
      before: b || null,
      after: a || null,
      status: !b && a ? 'added' : b && !a ? 'removed' : 'changed',
    })
  }
  return diffs
}

function summaryDiff(before: SnapshotLike, after: SnapshotLike): ImportFeedbackFieldDiff | null {
  const b = normStr(before.summary)
  const a = normStr(after.summary)
  if (b === a) return null
  return {
    path: 'summary',
    category: 'summary',
    before: b || null,
    after: a || null,
    status: !b && a ? 'added' : b && !a ? 'removed' : 'changed',
  }
}

function listDiff<T>(
  pathPrefix: string,
  category: ImportFeedbackFieldCategory,
  before: T[] | undefined,
  after: T[] | undefined,
  fingerprint: (item: T) => string,
): ImportFeedbackFieldDiff[] {
  const diffs: ImportFeedbackFieldDiff[] = []
  const bList = before ?? []
  const aList = after ?? []
  const maxLen = Math.max(bList.length, aList.length)
  for (let i = 0; i < maxLen; i++) {
    const b = bList[i]
    const a = aList[i]
    if (!b && a) {
      diffs.push({ path: `${pathPrefix}[${i}]`, category, before: null, after: a, status: 'added' })
      continue
    }
    if (b && !a) {
      diffs.push({ path: `${pathPrefix}[${i}]`, category, before: b, after: null, status: 'removed' })
      continue
    }
    if (b && a && fingerprint(b) !== fingerprint(a)) {
      diffs.push({ path: `${pathPrefix}[${i}]`, category, before: b, after: a, status: 'changed' })
    }
  }
  return diffs
}

export function stripExtractionMeta<T extends Record<string, unknown>>(data: T): Omit<T, '_extraction'> {
  const { _extraction: _ignored, ...rest } = data
  return rest
}

export function computeImportFieldDiffs(
  original: SnapshotLike,
  corrected: SnapshotLike,
): ImportFeedbackFieldDiff[] {
  const diffs: ImportFeedbackFieldDiff[] = [...contactDiffs(original, corrected)]
  const s = summaryDiff(original, corrected)
  if (s) diffs.push(s)

  diffs.push(
    ...listDiff(
      'experiences',
      'experience',
      original.experiences,
      corrected.experiences,
      (e) => `${normStr(e.position)}|${normStr(e.company)}|${normStr(e.startDate)}`,
    ),
    ...listDiff(
      'educations',
      'education',
      original.educations,
      corrected.educations,
      (e) => `${normStr(e.degree)}|${normStr(e.institution)}|${normStr(e.endDate)}`,
    ),
  )

  const bSkills = (original.skills ?? [])
    .map((s) => normStr(s.name).toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|')
  const aSkills = (corrected.skills ?? [])
    .map((s) => normStr(s.name).toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|')
  if (bSkills !== aSkills) {
    diffs.push({
      path: 'skills',
      category: 'skill',
      before: original.skills ?? [],
      after: corrected.skills ?? [],
      status: 'changed',
    })
  }

  diffs.push(
    ...listDiff(
      'languages',
      'language',
      original.languages,
      corrected.languages,
      (l) => `${normStr(l.name)}|${normStr(l.level)}`,
    ),
    ...listDiff(
      'certifications',
      'certification',
      original.certifications,
      corrected.certifications,
      (c) => `${normStr(c.name)}|${normStr(c.issuer)}`,
    ),
  )

  return diffs.filter((d) => d.status !== 'unchanged')
}

export function aggregateFieldDiffStats(
  allDiffs: ImportFeedbackFieldDiff[][],
): Array<{ category: ImportFeedbackFieldCategory; count: number; paths: string[] }> {
  const map = new Map<string, { category: ImportFeedbackFieldCategory; count: number; paths: Set<string> }>()
  for (const diffs of allDiffs) {
    for (const d of diffs) {
      const cur = map.get(d.category) ?? { category: d.category, count: 0, paths: new Set<string>() }
      cur.count++
      cur.paths.add(d.path.split('[')[0] ?? d.path)
      map.set(d.category, cur)
    }
  }
  return [...map.values()]
    .map((v) => ({ category: v.category, count: v.count, paths: [...v.paths] }))
    .sort((a, b) => b.count - a.count)
}
