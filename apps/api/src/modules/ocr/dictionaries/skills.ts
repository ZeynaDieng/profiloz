import type { Skill } from '@profiloz/shared'

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.]/g, '')
}

/**
 * Dictionnaire de compétences techniques et métiers.
 * Chaque entrée possède un motif tolérant aux variantes (React.js, nodejs…).
 */
export const SKILL_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'React', pattern: /\breact(?:\.?\s*js|js)?\b/i },
  { name: 'Vue', pattern: /\bvue(?:\.?\s*js|js)?\b/i },
  { name: 'Nuxt', pattern: /\bnuxt(?:\.?\s*js|js)?\b/i },
  { name: 'Angular', pattern: /\bangular\b/i },
  { name: 'Next.js', pattern: /\bnext(?:\.?\s*js|js)\b/i },
  { name: 'Svelte', pattern: /\bsvelte\b/i },
  { name: 'TypeScript', pattern: /\btypescript\b|\bts\b(?=\s|,|$)/i },
  { name: 'JavaScript', pattern: /\bjavascript\b|\bjs\b(?=\s|,|$)/i },
  { name: 'Node.js', pattern: /\bnode(?:\.?\s*js|js)\b/i },
  { name: 'PHP', pattern: /\bphp\b/i },
  { name: 'Laravel', pattern: /\blaravel\b/i },
  { name: 'Symfony', pattern: /\bsymfony\b/i },
  { name: 'NestJS', pattern: /\bnest(?:\.?\s*js|js)\b/i },
  { name: 'Spring', pattern: /\bspring(?:\s+boot|\s+framework)?\b/i },
  { name: 'Java', pattern: /\bjava\b(?!\s*script)/i },
  { name: 'Python', pattern: /\bpython\b/i },
  { name: 'Django', pattern: /\bdjango\b/i },
  { name: 'Flask', pattern: /\bflask\b/i },
  { name: 'C#', pattern: /\bc\s*#|\bcsharp\b/i },
  { name: '.NET', pattern: /\b\.?net\b/i },
  { name: 'Go', pattern: /\bgolang\b|\bgo\b(?=\s|,|$)/i },
  { name: 'Rust', pattern: /\brust\b/i },
  { name: 'Kotlin', pattern: /\bkotlin\b/i },
  { name: 'Swift', pattern: /\bswift\b/i },
  { name: 'SQL', pattern: /\bsql\b/i },
  { name: 'PostgreSQL', pattern: /\bpostgres(?:ql)?\b/i },
  { name: 'MySQL', pattern: /\bmysql\b/i },
  { name: 'MongoDB', pattern: /\bmongodb\b/i },
  { name: 'Redis', pattern: /\bredis\b/i },
  { name: 'Docker', pattern: /\bdocker\b/i },
  { name: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i },
  { name: 'Git', pattern: /\bgit\b(?!\s*hub)/i },
  { name: 'GitHub', pattern: /\bgithub\b/i },
  { name: 'GitLab', pattern: /\bgitlab\b/i },
  { name: 'AWS', pattern: /\baws\b|\bamazon web services\b/i },
  { name: 'Azure', pattern: /\bazure\b/i },
  { name: 'GCP', pattern: /\bgcp\b|\bgoogle cloud\b/i },
  { name: 'Linux', pattern: /\blinux\b/i },
  { name: 'Figma', pattern: /\bfigma\b/i },
  { name: 'Adobe XD', pattern: /\badobe\s*xd\b|\bxd\b/i },
  { name: 'Photoshop', pattern: /\bphotoshop\b/i },
  { name: 'Illustrator', pattern: /\billustrator\b/i },
  { name: 'InDesign', pattern: /\bindesign\b/i },
  { name: 'Excel', pattern: /\bexcel\b/i },
  { name: 'Power BI', pattern: /\bpower\s*bi\b/i },
  { name: 'Word', pattern: /\bword\b/i },
  { name: 'PowerPoint', pattern: /\bpowerpoint\b/i },
  { name: 'SAGE 100', pattern: /\bsage\s*100\b|\bsage100\b/i },
  { name: 'Agile', pattern: /\bagile\b/i },
  { name: 'Scrum', pattern: /\bscrum\b/i },
  { name: 'Jira', pattern: /\bjira\b/i },
  { name: 'HTML', pattern: /\bhtml(?:5)?\b/i },
  { name: 'CSS', pattern: /\bcss(?:3)?\b/i },
  { name: 'SASS', pattern: /\bsass\b|\bscss\b/i },
  { name: 'Tailwind', pattern: /\btailwind(?:css)?\b/i },
  { name: 'Bootstrap', pattern: /\bbootstrap\b/i },
  { name: 'GraphQL', pattern: /\bgraphql\b/i },
  { name: 'REST API', pattern: /\brest(?:ful)?\s*api\b|\bapi rest\b/i },
  { name: 'Terraform', pattern: /\bterraform\b/i },
  { name: 'CI/CD', pattern: /\bci\s*\/\s*cd\b|\bcicd\b/i },
  { name: 'SEO', pattern: /\bseo\b/i },
  { name: 'Google Analytics', pattern: /\bgoogle analytics\b/i },
]

/** Alias de fusion (reactjs → React, nodejs → Node.js…). */
const SKILL_ALIASES: Record<string, string> = {
  reactjs: 'React',
  vuejs: 'Vue',
  nuxtjs: 'Nuxt',
  nextjs: 'Next.js',
  nodejs: 'Node.js',
  nestjs: 'NestJS',
  postgresql: 'PostgreSQL',
  powerbi: 'Power BI',
  sage100: 'SAGE 100',
  adobexd: 'Adobe XD',
  googleanalytics: 'Google Analytics',
  restapi: 'REST API',
  cicd: 'CI/CD',
}

export function canonicalSkillName(name: string): string {
  const key = normalizeKey(name)
  return SKILL_ALIASES[key] ?? name.trim()
}

/**
 * Extrait les compétences connues depuis un texte libre (phrase, profil, missions).
 * Ne remplace pas l'extracteur de section — complète le résultat.
 */
export function extractSkillsFromText(text: string): Skill[] {
  const found = new Map<string, Skill>()

  for (const { name, pattern } of SKILL_PATTERNS) {
    if (!pattern.test(text)) continue
    const canonical = canonicalSkillName(name)
    const key = normalizeKey(canonical)
    if (!key || found.has(key)) continue
    found.set(key, { name: canonical })
  }

  return [...found.values()]
}

/** Retire les doublons inclus (« Excel » si « Microsoft Excel » est déjà présent). */
export function dedupeContainedSkills(skills: Skill[]): Skill[] {
  const sorted = [...skills].sort((a, b) => b.name.length - a.name.length)
  const kept: Skill[] = []

  for (const skill of sorted) {
    const key = normalizeKey(skill.name)
    if (!key) continue
    const contained = kept.some((existing) => {
      const existingKey = normalizeKey(existing.name)
      return existingKey.includes(key) && existing.name.length > skill.name.length
    })
    if (contained) continue
    kept.push(skill)
  }

  return kept
}

/** Fusionne deux listes de compétences sans doublons (tolère les alias). */
export function mergeSkillLists(primary: Skill[], secondary: Skill[]): Skill[] {
  const result: Skill[] = []
  const seen = new Set<string>()

  for (const skill of [...primary, ...secondary]) {
    const name = canonicalSkillName(skill.name)
    const key = normalizeKey(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(skill.category ? { name, category: skill.category } : { name })
  }

  return dedupeContainedSkills(result).slice(0, 50)
}
