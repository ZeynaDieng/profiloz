/**
 * Génère cv-samples/ à partir des 10 cas manuels du corpus (texte + ground truth).
 * Les fichiers .txt simulent l'OCR sans couche Tesseract — pour les vrais PDF/DOCX,
 * déposez-les dans cv-samples/files/ et mettez à jour manifest.json + ground-truth/.
 *
 *   pnpm ocr:generate-samples
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { manualCorpusCases } from '../__tests__/corpus/cases'
import type { RealCvGroundTruth, RealCvTags } from '../modules/ocr/validation/real-corpus'

const ROOT = resolve(process.cwd(), '..', '..', 'cv-samples')

const TAGS_BY_NAME: Record<string, RealCvTags> = {
  'classique-1-colonne': { tool: 'word', columns: 1, language: 'fr', source: 'txt', style: 'classic' },
  'deux-colonnes-date-d-abord': { tool: 'unknown', columns: 2, language: 'fr', source: 'pdf-text', style: 'modern' },
  'etudiant-formation-d-abord': { tool: 'word', columns: 1, language: 'fr', source: 'txt', style: 'classic' },
  'tech-competences-labellisees': { tool: 'word', columns: 1, language: 'fr', source: 'txt', style: 'modern' },
  'labels-europeen': { tool: 'europass', columns: 1, language: 'fr', source: 'txt', style: 'classic' },
  'deux-colonnes-libelles-typo': { tool: 'unknown', columns: 2, language: 'fr', source: 'pdf-scanned', style: 'classic' },
  'executif-poste-en-cours': { tool: 'word', columns: 1, language: 'fr', source: 'txt', style: 'classic' },
  'reel-dev-moderne-1-colonne': { tool: 'canva', columns: 1, language: 'fr', source: 'txt', style: 'modern' },
  'reel-2-colonnes-nom-en-pied': { tool: 'unknown', columns: 2, language: 'fr', source: 'pdf-text', style: 'modern' },
  'reel-4-colonnes-experiences-en-fin': { tool: 'adobe', columns: 4, language: 'fr', source: 'pdf-text', style: 'modern' },
}

/** Annotations manuelles détaillées (validation terrain). */
const GROUND_TRUTH: Record<string, Partial<RealCvGroundTruth>> = {
  'classique-1-colonne': {
    identity: { fullName: 'Camille Durand', jobTitle: 'Cheffe de projet digital' },
    contact: { email: 'camille.durand@example.com', phone: '06 12 34 56 78', location: 'Lyon' },
    experiences: [
      { position: 'Cheffe de projet digital', company: 'Agence Pixel', startDate: '2019', endDate: '2022' },
      { position: 'Chef de projet junior', company: 'WebStudio', startDate: '2016', endDate: '2019' },
    ],
    educations: [{ degree: 'Master Marketing Digital', institution: 'Université Lyon 2' }],
    skills: ['Gestion de projet', 'Agile', 'Scrum', 'SEO', 'Google Analytics'],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Espagnol' }],
  },
  'deux-colonnes-date-d-abord': {
    identity: { fullName: 'Dieynaba CAMARA', jobTitle: 'Aide-Soignante' },
    experiences: [
      { position: 'Aide Soignante', company: 'Poste de Santé de Baegny' },
      { position: 'Aide Soignante', company: 'Clinique Kissy Santé' },
    ],
    educations: [{ degree: 'En Santé', institution: 'Centre Polyvalent de formation' }],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Wolof' }],
  },
  'etudiant-formation-d-abord': {
    identity: { fullName: 'Lucas Martin', jobTitle: 'Étudiant en informatique' },
    contact: { email: 'lucas.martin@etu.example.com', phone: '07 88 99 00 11' },
    experiences: [{ position: 'Stage développeur web', company: 'StartupX' }],
    educations: [
      { degree: 'Licence Informatique', institution: 'Université de Bordeaux' },
      { degree: 'Baccalauréat Scientifique', institution: 'Lycée Montaigne' },
    ],
    skills: ['JavaScript', 'Vue.js', 'Python', 'Git', 'SQL'],
    interests: ['Football', 'Jeux vidéo', 'Photographie'],
  },
  'tech-competences-labellisees': {
    identity: { fullName: 'Sarah Benali', jobTitle: 'Développeuse Full-Stack' },
    contact: { email: 'sarah.benali@example.com', linkedinUrl: 'linkedin.com/in/sarahbenali' },
    experiences: [
      { position: 'Développeuse Full-Stack', company: 'TechCorp' },
      { position: 'Développeuse Front-End', company: 'DigitalAgency' },
    ],
    educations: [{ degree: 'Master Génie Logiciel', institution: 'INSA Lyon' }],
    skills: ['React', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'PostgreSQL'],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Arabe' }],
  },
  'labels-europeen': {
    identity: { fullName: 'Thomas Lefèvre', jobTitle: 'Responsable commercial' },
    contact: {
      email: 'thomas.lefevre@example.com',
      phone: '+33 6 45 67 89 01',
      location: 'Marseille',
    },
    experiences: [
      { position: 'Responsable commercial', company: 'GrandeEntreprise SA' },
      { position: 'Commercial terrain', company: 'PME Distribution' },
    ],
    educations: [{ degree: 'BTS Négociation et Relation Client', institution: 'Lycée Saint-Charles' }],
    skills: ['Négociation', 'Prospection', 'CRM', 'Management'],
  },
  'deux-colonnes-libelles-typo': {
    identity: { fullName: 'Aminata DIALLO' },
    contact: {
      email: 'aminata.diallo@example.com',
      phone: '+221 77 123 45 67',
      location: 'Dakar',
    },
    experiences: [
      { position: 'Pharmacienne', company: 'Clinique Centrale' },
      { position: 'Préparatrice en pharmacie', company: 'Pharmacie du Plateau' },
    ],
    educations: [{ degree: 'Baccalauréat scientifique', institution: 'Lycée Moderne' }],
    skills: ['Rigueur', 'Travail en équipe', 'Communication'],
    languages: [{ name: 'Français' }, { name: 'Anglais' }],
    interests: ['Lecture', 'Sport'],
  },
  'executif-poste-en-cours': {
    identity: { fullName: 'Isabelle Moreau', jobTitle: 'Directrice Générale Adjointe' },
    contact: { email: 'isabelle.moreau@example.com', phone: '06 22 33 44 55', location: 'Paris' },
    experiences: [
      { position: 'Directrice Générale Adjointe', company: 'Groupe Industriel France', isCurrent: true },
      { position: 'Directrice des Opérations', company: 'Manufacture Nationale' },
    ],
    educations: [
      { degree: 'MBA', institution: 'HEC Paris' },
      { degree: "Diplôme d'ingénieur", institution: 'École Centrale' },
    ],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Allemand' }],
  },
  'reel-dev-moderne-1-colonne': {
    identity: { fullName: 'Awa Sow', jobTitle: 'Développeuse Full-stack' },
    contact: {
      email: 'awa.sow@example.com',
      phone: '+221 77 000 00 00',
      location: 'Dakar',
    },
    experiences: [
      { position: 'Développeuse Full-stack', company: 'Intech Group' },
      { position: 'Développeuse Full-stack', company: 'Orion' },
      { position: 'Développeuse Web Freelance', company: '' },
    ],
    educations: [
      { degree: 'Master en Génie Logiciel', institution: 'IPD' },
      { degree: 'Licence en Informatique', institution: 'ENsup Afrique' },
    ],
    skills: ['JavaScript', 'TypeScript', 'Laravel', 'Nuxt.js', 'NestJS', 'MySQL'],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Wolof' }],
    interests: ['Codage créatif', 'hackathons', 'méditation'],
  },
  'reel-2-colonnes-nom-en-pied': {
    identity: { fullName: 'Fatou Sarr', jobTitle: 'Comptable' },
    contact: { email: 'fatou.sarr@example.com', phone: '77 000 00 00', location: 'Dakar' },
    experiences: [
      { position: 'Chargée des relations externes', company: 'Rajab Business' },
      { position: 'Assistante de Direction', company: 'Immo-Négoce' },
      { position: 'Conseillère clientèle', company: 'PCCI Dakar' },
    ],
    educations: [{ degree: '2ème année de Formation', institution: 'ENSUP AFRIQUE' }],
  },
  'reel-4-colonnes-experiences-en-fin': {
    identity: { fullName: 'Modou Fall', jobTitle: 'Plombier' },
    contact: {
      email: 'modou.fall@example.com',
      phone: '(+221) 70 000 00 00',
      location: 'Rufisque',
    },
    experiences: [
      { position: 'Plombier Sous-Traitant', company: 'INDÉPENDANT' },
      { position: 'Plombier', company: 'ENTREPRISE ESPAGNOLE KALIA' },
      { position: 'Plombier', company: 'BATILUX' },
    ],
    skills: ['Installation de réseaux de plomberie', 'Détection et réparation de fuites'],
    languages: [{ name: 'Français' }, { name: 'Anglais' }, { name: 'Wolof' }],
  },
}

async function main() {
  const filesDir = join(ROOT, 'files')
  const gtDir = join(ROOT, 'ground-truth')
  const reportsDir = join(ROOT, 'reports')

  await mkdir(filesDir, { recursive: true })
  await mkdir(gtDir, { recursive: true })
  await mkdir(reportsDir, { recursive: true })

  const entries: RealCvGroundTruth[] = []

  for (const c of manualCorpusCases) {
    const fileName = `${c.name}.txt`
    const text = c.rawText.trim() + '\n'
    await writeFile(join(filesDir, fileName), text, 'utf8')

    const gt: RealCvGroundTruth = {
      id: c.name,
      file: `files/${fileName}`,
      tags: TAGS_BY_NAME[c.name] ?? { source: 'txt', language: 'fr' },
      annotatedAt: new Date().toISOString().slice(0, 10),
      annotatedBy: 'corpus-manuel',
      notes: c.format,
      ...GROUND_TRUTH[c.name],
    }

    await writeFile(join(gtDir, `${c.name}.json`), JSON.stringify(gt, null, 2), 'utf8')
    entries.push(gt)
  }

  await writeFile(
    join(ROOT, 'manifest.json'),
    JSON.stringify({ version: 1, description: 'Corpus terrain Profilo\'Z — cas manuels + vos CV anonymisés', entries }, null, 2),
    'utf8',
  )

  console.log(`✓ ${entries.length} échantillons générés dans ${ROOT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
