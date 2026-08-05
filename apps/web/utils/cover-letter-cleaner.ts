/**
 * Nettoie le corps d'une lettre de motivation pour supprimer les entêtes superflues :
 * - Placeholders entre crochets : [Votre Nom], [Votre Adresse], [Votre Numéro...], [Votre E-mail]
 * - Bloc Destinataire : "À l'attention du Responsable des Ressources Humaines...", "Avenue Cheikh Anta Diop..."
 * - Ligne d'Objet : "Objet : Candidature..."
 * 
 * Les coordonnées expéditeur/destinataire et l'objet sont déjà gérés par les sections 2 & 3 du formulaire.
 */
const HEADER_PLACEHOLDER_RE =
  /^\s*\[\s*(?:votre|nom|prénom|prenom|adresse|téléphone|telephone|numéro|numero|e-?mail|coordonnées|destinataire|entreprise|ville|pays)\b.*?\]\s*$/i

const RECIPIENT_HEADER_RE =
  /^(?:à\s+l['']?attention\s+d[eu]|à\s+l['']?attention\s+de|destinataire\s*:?|aux\s+soins\s+de|service\s+des\s+ressources|direction\s+des\s+ressources)/i

const OBJECT_HEADER_RE = /^(?:objet|subject)\s*[:：\s]/i

const CONTACT_LINE_RE =
  /^(?:(?:e-?mail|tél|tel|téléphone|adresse|location|site)\s*[:：]|[\w.-]+@[\w.-]+\.\w+|\+?\d[\d\s.-]{7,})/i

const ADDRESS_HEADER_RE = /^(?:avenue|rue|boulevard|b\.?p\.?|cité|route|quartier)\b/i

const SALUTATION_RE = /^(?:madame,?\s*monsieur,?|mesdames,?\s*messieurs,?|chère|cher)\b/i

export function cleanCoverLetterBodyText(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) return ''

  const lines = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let bodyStart = 0
  let foundSalutationOrBody = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim()

    // Lignes vides au tout début
    if (!trimmed) {
      if (!foundSalutationOrBody) bodyStart = i + 1
      continue
    }

    // Si on tombe sur la formule de salutation ("Madame, Monsieur,")
    if (SALUTATION_RE.test(trimmed)) {
      bodyStart = i
      foundSalutationOrBody = true
      break
    }

    // Filtre des placeholders entre crochets [Votre Nom], [Votre Adresse]...
    if (HEADER_PLACEHOLDER_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    // Filtre des blocs Destinataire "À l'attention du..."
    if (RECIPIENT_HEADER_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    // Filtre de la ligne Objet
    if (OBJECT_HEADER_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    // Filtre des coordonnées isolées (email, téléphone)
    if (CONTACT_LINE_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    // Filtre des adresses d'entête isolées ("Avenue Cheikh Anta Diop, Dakar")
    if (ADDRESS_HEADER_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    // Si la ligne ne correspond à aucun entête et n'est pas du bruit, c'est le début du texte principal
    if (trimmed.length > 25 || foundSalutationOrBody) {
      bodyStart = i
      break
    }
  }

  const cleanedLines = lines.slice(bodyStart)
  const result = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  return result || rawContent.trim()
}
