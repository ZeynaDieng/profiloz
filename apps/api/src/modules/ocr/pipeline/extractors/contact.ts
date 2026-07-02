import type { PersonalInfo } from '@profiloz/shared'

const EMAIL_RE = /[\p{L}\p{N}.+-]+@[\p{L}\p{N}-]+\.[\p{L}\p{N}.-]+/iu
const PHONE_RE = /(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,]+/i
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,]+/i
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s,]*)?/i

const CITY_RE =
  /\b(?:dakar|rufisque|diamniadio|ouakam|pikine|thies|thi[èe]s|abidjan|paris|lyon|marseille|bordeaux|lille|nice|montpellier|casablanca|tunis|bamako|conakry|ouagadougou)\b/i

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^www\./i, '')}`
}

/** Trouve un site perso / portfolio (hors email, linkedin, github). */
function findWebsite(rawText: string): string | undefined {
  for (const rawLine of rawText.split('\n')) {
    if (EMAIL_RE.test(rawLine)) continue
    const matches = rawLine.match(new RegExp(URL_RE, 'gi'))
    if (!matches) continue
    for (const candidate of matches) {
      if (/linkedin\.com|github\.com/i.test(candidate)) continue
      if (!/^https?:\/\//i.test(candidate) && !/^www\./i.test(candidate) && !candidate.includes('/')) continue
      return ensureProtocol(candidate)
    }
  }
  return undefined
}

/** Extrait une localisation depuis une ligne d'adresse non libellée. */
function parseAddressLine(line: string): string | undefined {
  const c = line.trim()
  if (!c || c.length < 4 || c.length > 120) return undefined
  if (EMAIL_RE.test(c) || PHONE_RE.test(c) || URL_RE.test(c)) return undefined
  if (/^[\d\s().+-]+$/.test(c)) return undefined

  const segments = c.split(/[,|]/).map((part) => part.trim()).filter(Boolean)
  for (const segment of segments) {
    if (CITY_RE.test(segment)) {
      const city = segment.match(CITY_RE)?.[0]
      if (city) return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    }
  }

  const commaMatch = c.match(/^[^,]{2,40},\s*([A-Za-zÀ-ÿ'’ -]{2,35})(?:\s*[-–—]\s*[A-Za-zÀ-ÿ'’ -]{2,25})?$/)
  if (commaMatch?.[1]) return commaMatch[1].trim()

  if (CITY_RE.test(c)) {
    const city = c.match(CITY_RE)?.[0]
    if (city) return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
  }

  return undefined
}

function pickBestLocation(current?: string, candidate?: string): string | undefined {
  if (!candidate?.trim()) return current?.trim() || undefined
  if (!current?.trim()) return candidate.trim()
  const cur = current.trim()
  const cand = candidate.trim()
  if (CITY_RE.test(cand) && !CITY_RE.test(cur)) return cand
  if (cur.length <= 12 && cand.length > cur.length) return cand
  return cur
}

/** Cherche la localisation près du cluster email / téléphone. */
function extractLocation(rawText: string): string | undefined {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)

  for (let i = 0; i < lines.length; i++) {
    if (!EMAIL_RE.test(lines[i]!) && !PHONE_RE.test(lines[i]!)) continue

    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
      if (j === i) continue
      const loc = parseAddressLine(lines[j]!)
      if (loc) return loc.split(/\s*[-–—]\s*/)[0]?.trim() || loc
    }
  }

  for (const line of lines.slice(0, 15)) {
    const loc = parseAddressLine(line)
    if (loc) return loc.split(/\s*[-–—]\s*/)[0]?.trim() || loc
  }

  return undefined
}

/**
 * Extracteur de coordonnées : complète les informations personnelles déjà
 * détectées avec email, téléphone, LinkedIn, GitHub, site/portfolio et localisation.
 *
 * N'écrase jamais une valeur existante (on enrichit, on ne remplace pas).
 */
export function augmentContact(base: PersonalInfo, rawText: string): PersonalInfo {
  const info: PersonalInfo = { ...base }

  if (!info.email) info.email = rawText.match(EMAIL_RE)?.[0]
  if (!info.phone) info.phone = rawText.match(PHONE_RE)?.[0]?.trim()
  if (!info.linkedinUrl) {
    const linkedin = rawText.match(LINKEDIN_RE)?.[0]
    if (linkedin) info.linkedinUrl = ensureProtocol(linkedin)
  }

  if (!info.websiteUrl) {
    const portfolio = findWebsite(rawText)
    const github = rawText.match(GITHUB_RE)?.[0]
    if (portfolio) info.websiteUrl = portfolio
    else if (github) info.websiteUrl = ensureProtocol(github)
  }

  if (!info.location) {
    info.location = extractLocation(rawText)
  } else {
    info.location = pickBestLocation(info.location, extractLocation(rawText))
  }

  return info
}
