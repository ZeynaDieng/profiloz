import type { PersonalInfo } from '@profiloz/shared'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,]+/i
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,]+/i
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s,]*)?/i

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^www\./i, '')}`
}

/** Trouve un site perso / portfolio (hors email, linkedin, github). */
function findWebsite(rawText: string): string | undefined {
  for (const rawLine of rawText.split('\n')) {
    // On ignore les lignes contenant un email (évite de prendre le domaine
    // de l'adresse, ex. "prenom.nom" dans "prenom.nom@mail.com").
    if (EMAIL_RE.test(rawLine)) continue
    const matches = rawLine.match(new RegExp(URL_RE, 'gi'))
    if (!matches) continue
    for (const candidate of matches) {
      if (/linkedin\.com|github\.com/i.test(candidate)) continue
      // Un vrai lien : protocole, www., ou présence d'un chemin.
      if (!/^https?:\/\//i.test(candidate) && !/^www\./i.test(candidate) && !candidate.includes('/')) continue
      return ensureProtocol(candidate)
    }
  }
  return undefined
}

/**
 * Extracteur de coordonnées : complète les informations personnelles déjà
 * détectées avec email, téléphone, LinkedIn, GitHub et site/portfolio.
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

  return info
}
