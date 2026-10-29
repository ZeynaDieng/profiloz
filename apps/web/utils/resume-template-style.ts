import type { SkillLevel } from '@profiloz/shared'

export type ResumeContactIconName = 'envelope' | 'phone' | 'marker' | 'linkedin' | 'globe'

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mélange vers le blanc : shade 50 = 50 % de blanc. */
export function shadeColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c + (255 - c) * (percent / 100)))
  return `rgb(${r}, ${g}, ${b})`
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Blanc si le contraste du blanc sur `hex` atteint `minContrast`, sinon noir. */
export function contrastTextColor(hex: string, minContrast = 1.85): '#ffffff' | '#000000' {
  return (1 + 0.05) / (relativeLuminance(hex) + 0.05) >= minContrast ? '#ffffff' : '#000000'
}

export const SKILL_LEVEL_PERCENT: Record<SkillLevel, number> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  EXPERT: 100,
}

/** Niveau sur 5 points. */
export const SKILL_LEVEL_DOTS: Record<SkillLevel, number> = {
  BEGINNER: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5,
}

// Les niveaux de langue arrivent déjà formatés (libellés)
const LANGUAGE_LEVEL_PERCENT: Record<string, number> = {
  Maternelle: 100,
  Courant: 75,
  Intermédiaire: 50,
  Notions: 25,
}

const LANGUAGE_LEVEL_DOTS: Record<string, number> = {
  Maternelle: 5,
  Courant: 4,
  Intermédiaire: 3,
  Notions: 2,
}

export const languageLevelPercent = (level: string) => LANGUAGE_LEVEL_PERCENT[level] ?? 50
export const languageLevelDots = (level: string) => LANGUAGE_LEVEL_DOTS[level] ?? 3

/** Une ligne de description = une puce (les puces saisies « - », « • », « * » sont retirées). */
export function descriptionBullets(text?: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
}
