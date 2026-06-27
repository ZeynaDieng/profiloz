import type { Experience } from '@profiloz/shared'
import {
  cleanLine,
  isBulletLine,
  isDateOnlyLine,
  looksLikeExperienceTitle,
  looksLikeLocation,
  parseDateRange,
  parseExperienceLine,
  stripBullet,
} from '../../ocr.parser'

function isSubstantial(entry: Experience): boolean {
  return Boolean(entry.position?.trim() && (entry.company?.trim() || entry.startDate || entry.endDate))
}

function isMeaningful(entry: Experience): boolean {
  return Boolean(entry.position?.trim() || entry.company?.trim())
}

function appendDescription(entry: Experience, text: string) {
  entry.description = [entry.description, text].filter(Boolean).join('\n')
}

const SKILLS_USED_RE =
  /^(?:comp[ée]tences?(?:\s+(?:utilis[ée]es?|mobilis[ée]es?|cl[ée]s?))?|outils?|technologies?|stack|environnement technique)\s*[:：]\s*(.+)$/i

/**
 * Ligne de mission/responsabilité (puce sans marqueur) : commence par un verbe
 * d'action à l'infinitif. Elle décrit l'entrée courante, ce n'est pas un nouveau
 * poste — sinon elle créerait une fausse expérience.
 */
const RESPONSIBILITY_VERB_RE =
  /^(?:assister|aider|pr[ée]parer|entretenir|g[ée]rer|organiser|coordonner|r[ée]aliser|participer|assurer|d[ée]velopper|mettre|suivre|contr[oô]ler|effectuer|encadrer|animer|accueillir|communiquer|veiller|planifier|superviser|former|conseiller|accompagner|r[ée]diger|analyser|concevoir|maintenir|installer|configurer|optimiser|[ée]laborer|piloter|garantir|contribuer|fournir|traiter|saisir|nettoyer|surveiller|soigner|administrer|prendre|effectuer)\b/i

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s'-]/g, '')
    .trim()
}

/** Pays reconnus (pour ne pas confondre une ville avec un pays). */
const KNOWN_COUNTRIES = new Set([
  'senegal', 'france', 'mali', "cote d'ivoire", 'cote divoire', 'maroc', 'tunisie', 'algerie',
  'canada', 'belgique', 'suisse', 'allemagne', 'espagne', 'italie', 'portugal', 'royaume-uni',
  'etats-unis', 'usa', 'benin', 'togo', 'guinee', 'mauritanie', 'gambie', 'niger', 'burkina faso',
  'cameroun', 'gabon', 'congo', 'ghana', 'nigeria', 'angleterre', 'pays-bas', 'luxembourg',
])

/** Sépare « Ville, Pays » → { location, country } UNIQUEMENT si le dernier segment est un pays connu. */
function splitLocationCountry(value: string): { location?: string; country?: string } {
  const parts = value.split(/\s*[,/]\s*/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2 && KNOWN_COUNTRIES.has(norm(parts[parts.length - 1]!))) {
    return { location: parts.slice(0, -1).join(', '), country: parts[parts.length - 1] }
  }
  return { location: value }
}

/** Mots-clés d'organisation : signal fort qu'une ligne est un employeur. */
const ORG_HINT_RE =
  /\b(minist[èe]re|groupe?|group|soci[ée]t[ée]|sa|sarl|sas|sasu|entreprise|cabinet|agence|clinique|h[ôo]pital|h[ôo]tel|centre|[ée]cole|universit[ée]|institut|fondation|association|holding|consulting|technologies?|telecom|ltd|inc|corp|company|services?|pharmacie|banque|assurance)\b/i

/**
 * Une ligne ressemble-t-elle à un nom d'employeur (et non à une mission/phrase) ?
 * Vrai si elle contient un mot-clé d'organisation, ou si elle est courte et sans
 * marqueur de description (virgule d'énumération, verbe d'action).
 */
function looksLikeCompany(line: string): boolean {
  let c = line.trim()
  if (c.length < 2) return false
  if (ORG_HINT_RE.test(c)) return true
  // On ignore un suffixe « , Ville » court pour le comptage (« Employeur, Ville »
  // est légitime, géré par splitCompanyCity) — sans laisser passer une énumération.
  const commaIdx = c.lastIndexOf(',')
  if (commaIdx > 0) {
    const tail = c.slice(commaIdx + 1).trim()
    if (tail.length <= 25 && tail.split(/\s+/).length <= 3) c = c.slice(0, commaIdx).trim()
  }
  // Le nombre de mots écarte les descriptions/énumérations (puces sans marqueur).
  const words = c.split(/\s+/)
  return words.length <= 6 && c.length <= 50 && !RESPONSIBILITY_VERB_RE.test(c)
}

/** Sépare « Employeur, Ville » → { company, location } (la ville est le dernier segment court). */
function splitCompanyCity(value: string): { company: string; location?: string } {
  const parts = value.split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]!
    if (last.length <= 30) {
      return { company: parts.slice(0, -1).join(', '), location: last }
    }
  }
  return { company: value }
}

/**
 * Extracteur d'expériences (sur un bloc isolé). Chaque expérience est une entrée
 * indépendante : un nouvel élément démarre dès qu'on rencontre une frontière
 * forte (ligne « poste — entreprise [dates] », date seule alors qu'une entrée
 * est déjà datée, ou nouveau titre de poste sur une entrée déjà constituée).
 * Le moteur ne fusionne jamais deux expériences distinctes.
 */
export function extractExperiences(lines: string[]): Experience[] {
  const entries: Experience[] = []
  let current: Experience | null = null

  const flush = () => {
    if (current && isMeaningful(current)) entries.push(current)
    current = null
  }

  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (!line) continue

    // Frontière forte : ligne combinée « rôle — entreprise [dates] ».
    const parsed = parseExperienceLine(line)
    if (parsed) {
      flush()
      current = parsed
      continue
    }

    // Format « date d'abord » : « Mars 2024 à Avril 2024  Aide Soignante »
    // (la plage de dates précède le poste). Nouvelle entrée à chaque plage.
    const dr = parseDateRange(line)
    const rest = cleanLine(dr.rest)
    if ((dr.startDate || dr.endDate || dr.isCurrent) && rest && rest !== line && !looksLikeLocation(rest)) {
      flush()
      current = {
        position: rest,
        company: '',
        startDate: dr.startDate,
        endDate: dr.endDate,
        isCurrent: dr.isCurrent,
      }
      continue
    }

    // Ligne « Compétences utilisées : … » → compétences de l'entrée courante.
    const skillsMatch = line.match(SKILLS_USED_RE)
    if (skillsMatch) {
      if (!current) current = { position: '', company: '' }
      const tokens = skillsMatch[1]!
        .split(/[,;/|•·]/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && t.length <= 60)
      if (tokens.length) current.skillsUsed = [...(current.skillsUsed ?? []), ...tokens]
      continue
    }

    // Puce → description de l'entrée courante.
    if (isBulletLine(line)) {
      if (!current) current = { position: '', company: '' }
      appendDescription(current, stripBullet(line))
      continue
    }

    // Mission/responsabilité (verbe d'action) sur une entrée déjà constituée →
    // description, et non un nouveau poste.
    if (current && isMeaningful(current) && RESPONSIBILITY_VERB_RE.test(line)) {
      appendDescription(current, stripBullet(line))
      continue
    }

    // Ligne de date seule.
    if (isDateOnlyLine(line)) {
      const dates = parseDateRange(line)
      if (current && !current.startDate && !current.endDate && !current.isCurrent) {
        current.startDate = dates.startDate
        current.endDate = dates.endDate
        current.isCurrent = dates.isCurrent
      } else {
        // Une date alors que l'entrée courante est déjà datée → nouvelle entrée.
        flush()
        current = { position: '', company: '', startDate: dates.startDate, endDate: dates.endDate, isCurrent: dates.isCurrent }
      }
      continue
    }

    // Titre de poste.
    if (looksLikeExperienceTitle(line)) {
      if (!current) {
        current = { position: line, company: '' }
      } else if (!current.position) {
        current.position = line
      } else if (!current.company) {
        // L'entrée a un poste mais pas encore d'employeur → cette ligne est
        // l'employeur (avec ville en suffixe éventuel), pas une nouvelle entrée.
        const { company, location } = splitCompanyCity(line)
        current.company = company
        if (location && !current.location) current.location = location
      } else if (isSubstantial(current)) {
        flush()
        current = { position: line, company: '' }
      } else {
        appendDescription(current, line)
      }
      continue
    }

    if (!current) {
      // Contenu avant tout titre : on amorce une entreprise possible.
      current = { position: '', company: line }
      continue
    }

    // Entreprise déjà connue → une ligne localisée est une ville (/ pays).
    if (current.company && looksLikeLocation(line) && !current.location) {
      const { location, country } = splitLocationCountry(line)
      current.location = location
      if (country) current.country = country
      continue
    }

    // Première ligne sous le poste → employeur (avec ville en suffixe éventuel),
    // SEULEMENT si elle ressemble à un employeur. Sinon c'est une mission/description
    // (puce dont le marqueur a été perdu à l'extraction).
    if (!current.company) {
      if (looksLikeCompany(line)) {
        const { company, location } = splitCompanyCity(line)
        current.company = company
        if (location && !current.location) current.location = location
      } else {
        appendDescription(current, line)
      }
      continue
    }

    appendDescription(current, line)
  }

  flush()
  return entries.slice(0, 15)
}
