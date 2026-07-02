/**
 * Corpus de CV de référence — formats volontairement variés.
 *
 * But : mesurer l'adaptation du moteur à des mises en page différentes et bloquer
 * toute régression. Pour ajouter un cas : copier un bloc, coller le texte (tel que
 * l'extraction PDF le produit) et renseigner des attentes minimales. Les textes
 * sont synthétiques (aucune donnée personnelle réelle).
 */

import { generateCorpusCases } from './generator'
import type { CorpusCase } from './types'

export type { CorpusCase, CorpusExpectations } from './types'

const manualCorpusCases: CorpusCase[] = [
  {
    name: 'classique-1-colonne',
    format: 'CV classique sur une colonne, dates « 2019 - 2022 »',
    rawText: `
Camille Durand
Cheffe de projet digital
camille.durand@example.com — 06 12 34 56 78 — Lyon

Profil
Cheffe de projet avec 8 ans d'expérience en transformation digitale.

Expérience professionnelle
Cheffe de projet digital — Agence Pixel, Lyon
2019 - 2022
- Pilotage de projets web pour des comptes grands groupes
- Gestion d'une équipe de 5 personnes

Chef de projet junior — WebStudio, Paris
2016 - 2019
- Coordination des prestataires techniques

Formation
Master Marketing Digital — Université Lyon 2
2014 - 2016

Compétences
Gestion de projet, Agile, Scrum, SEO, Google Analytics

Langues
Français, Anglais courant, Espagnol
`,
    expect: {
      fullName: 'Camille Durand',
      jobTitle: /chef/i,
      email: 'camille.durand@example.com',
      minExperiences: 2,
      maxExperiences: 2,
      minEducations: 1,
      minSkills: 4,
      minLanguages: 3,
      experiencePositions: [/chef/i, /chef/i],
    },
  },
  {
    name: 'deux-colonnes-date-d-abord',
    format: 'PDF 2 colonnes reconstruit, nom éclaté, format « date d’abord »',
    rawText: `
Dieynaba
CAMARA
Aide-Soignante
ExpériencesExpériencesExpériences
Mars 2024 à Avril 2024 Aide Soignante
Poste de Santé de Baegny, Rufisque
Assister les patients dans les activités quotidiennes
Préparer et entretenir le matériel médical
de Mai 2024 à Juin 2024 Aide Soignante
Clinique Kissy Santé, Dakar
FormationsFormationsFormations
de Oct 2024 à Août 2025 En Santé
Centre Polyvalent de formation
LanguesLanguesLangues
Français
Anglais moyen
Wolof
`,
    expect: {
      fullName: 'Dieynaba CAMARA',
      jobTitle: /aide-?soignante/i,
      minExperiences: 2,
      maxExperiences: 2,
      minEducations: 1,
      minLanguages: 3,
      experiencePositions: [/aide soignante/i, /aide soignante/i],
    },
  },
  {
    name: 'etudiant-formation-d-abord',
    format: 'CV étudiant : formation mise en avant, peu d’expérience',
    rawText: `
Lucas Martin
Étudiant en informatique
lucas.martin@etu.example.com | 07 88 99 00 11

Formation
Licence Informatique — Université de Bordeaux
2021 - 2024
Baccalauréat Scientifique — Lycée Montaigne
2021

Expérience
Stage développeur web — StartupX, Bordeaux
Juin 2023 - Août 2023
- Développement d'une application interne en Vue.js

Compétences
JavaScript, Vue.js, Python, Git, SQL

Centres d'intérêt
Football, Jeux vidéo, Photographie
`,
    expect: {
      fullName: 'Lucas Martin',
      email: 'lucas.martin@etu.example.com',
      minExperiences: 1,
      minEducations: 2,
      minSkills: 4,
      experiencePositions: [/stage|d[ée]veloppeur/i],
    },
  },
  {
    name: 'tech-competences-labellisees',
    format: 'CV développeur : « Compétences : … » et stack technique',
    rawText: `
Sarah Benali
Développeuse Full-Stack
sarah.benali@example.com
linkedin.com/in/sarahbenali

Expériences
Développeuse Full-Stack — TechCorp, Paris
Janvier 2021 - Présent
- Conception d'API REST en Node.js
Compétences : React, Node.js, TypeScript, PostgreSQL

Développeuse Front-End — DigitalAgency, Remote
2018 - 2021
- Intégration de maquettes Figma

Formation
Master Génie Logiciel — INSA Lyon
2016 - 2018

Compétences
React, Node.js, TypeScript, Docker, AWS, PostgreSQL

Langues
Français, Anglais, Arabe
`,
    expect: {
      fullName: 'Sarah Benali',
      jobTitle: /d[ée]veloppeu/i,
      email: 'sarah.benali@example.com',
      minExperiences: 2,
      minEducations: 1,
      minSkills: 5,
      minLanguages: 3,
      experiencePositions: [/full-?stack/i, /front-?end/i],
    },
  },
  {
    name: 'labels-europeen',
    format: 'Format à libellés « Nom : / Email : / Téléphone : »',
    rawText: `
Nom : Thomas Lefèvre
Poste : Responsable commercial
Email : thomas.lefevre@example.com
Téléphone : +33 6 45 67 89 01
Adresse : Marseille, France

Expérience professionnelle
Responsable commercial — GrandeEntreprise SA, Marseille
Septembre 2017 - Décembre 2022
- Développement du portefeuille clients régional

Commercial terrain — PME Distribution, Nice
2013 - 2017

Formation
BTS Négociation et Relation Client — Lycée Saint-Charles
2011 - 2013

Compétences
Négociation, Prospection, CRM, Management
`,
    expect: {
      fullName: 'Thomas Lefèvre',
      jobTitle: /commercial/i,
      email: 'thomas.lefevre@example.com',
      minExperiences: 2,
      minEducations: 1,
      minSkills: 3,
      experiencePositions: [/commercial/i, /commercial/i],
    },
  },
  {
    name: 'deux-colonnes-libelles-typo',
    format: 'PDF/OCR 2 colonnes reconstruit : en-têtes au singulier/avec fautes + « Nom : / Prénom : »',
    rawText: `
PROFIL
Pharmacienne rigoureuse et orientée patient.

EXPERIENCE PREFFESIONELLE
Pharmacienne — Clinique Centrale, Dakar
2020 - 2023
- Gestion de l'officine et conseil aux patients

Préparatrice en pharmacie — Pharmacie du Plateau, Dakar
2017 - 2020

ETUDE SECONDAIRE
Baccalauréat scientifique — Lycée Moderne
2015 - 2017

COMPETENCE
Rigueur
Travail en équipe
Communication

LANGUE
Français
Anglais

CENTRE D'INTERET
Lecture
Sport

Nom : DIALLO
Prénom : Aminata
Adresse : Dakar, Sénégal
Email : aminata.diallo@example.com
Téléphone : +221 77 123 45 67
`,
    expect: {
      fullName: 'Aminata DIALLO',
      email: 'aminata.diallo@example.com',
      minExperiences: 2,
      minEducations: 1,
      minSkills: 3,
      minLanguages: 2,
      experiencePositions: [/pharmacienne/i, /pr[ée]paratrice/i],
    },
  },
  {
    name: 'executif-poste-en-cours',
    format: 'CV exécutif : intitulés longs, poste « … - Présent »',
    rawText: `
Isabelle Moreau
Directrice Générale Adjointe
isabelle.moreau@example.com — 06 22 33 44 55 — Paris

Parcours exécutif
Directrice Générale Adjointe — Groupe Industriel France, Paris
Janvier 2018 - Présent
- Pilotage stratégique d'une BU de 300M€
- Supervision de 4 directions opérationnelles

Directrice des Opérations — Manufacture Nationale, Lille
2012 - 2018
- Optimisation de la chaîne logistique

Formation
MBA — HEC Paris
2008 - 2010
Diplôme d'ingénieur — École Centrale
2003 - 2008

Langues
Français, Anglais, Allemand
`,
    expect: {
      fullName: 'Isabelle Moreau',
      jobTitle: /directrice/i,
      email: 'isabelle.moreau@example.com',
      minExperiences: 2,
      minEducations: 2,
      minLanguages: 3,
      experiencePositions: [/directrice/i, /directrice/i],
    },
  },
  {
    name: 'reel-dev-moderne-1-colonne',
    format: 'CV réel anonymisé : moderne 1 colonne, « Nom - Poste », dates entre parenthèses, compétences préfixées',
    rawText: `
Awa Sow - Développeuse Full-stack
 Ouakam, Dakar (Sénégal) |  +221 77 000 00 00 | awa.sow@example.com
Profil Professionnel
Développeuse full-stack avec plus de 4 ans d'expérience spécialisée dans le développement
d'applications modernes, performantes et sécurisées.
Expérience
Développeuse Full-stack - Intech Group (Oct 2021 - Aujourd'hui)
 Développement complet de plusieurs applications Technologies : Laravel, Angular, Vue.js, Nuxt.js, MySQL, NestJS
 Intégration d'APIs REST sécurisées et optimisation des performances
Développeuse Full-stack - Orion (Oct 2024 - Aujourd'hui)
 Développement de modules frontend et interfaces d'administration
Développeuse Web Freelance (Sep 2024 - Aujourd'hui)
 Création de sites vitrines, e-commerce et back-office pour TPE/PME
Support Technique Multi-entreprises (2019-2024)
 Support utilisateurs, résolution de bugs et maintenance applicative
Formation
  Master en Génie Logiciel - IPD, Dakar (2024-2025, en cours)
  Licence en Informatique (Mention Bien) - ENsup Afrique (2019-2022)
Compétences Techniques
 Langages : JavaScript, TypeScript, PHP, HTML5, CSS3, SQL, VB.NET
 Frameworks : Nuxt.js, AngularJS, Laravel, NestJS, Ionic
 UI/Design : Tailwind CSS, Bootstrap, Responsive Design, Filament
 Base de données : MySQL, PostgreSQL
 Outils : Git/GitHub, REST API, Agile/Scrum, Tests unitaires
Langues
 Français : Bien | Anglais : Technique | Wolof : Très bien | Pullar : Les bases
Centres d'intérêt
Codage créatif, hackathons, méditation, veille technologique
`,
    strict: false,
    expect: {
      fullName: 'Awa Sow',
      jobTitle: /full-?stack/i,
      email: 'awa.sow@example.com',
      minExperiences: 4,
      minEducations: 2,
      minSkills: 12,
      minLanguages: 3,
      experiencePositions: [/full-?stack/i, /freelance/i],
    },
  },
  {
    name: 'reel-2-colonnes-nom-en-pied',
    format: 'CV réel anonymisé : 2 colonnes, section EXPÉRIENCE en tête, nom/poste relégués en pied de page (cas P2 layout)',
    rawText: `
EXPÉRIENCE
Chargée des relations externes
Rajab Business
Ouakam – Dakar
2023  2024
Assistante de Direction
Immo-Négoce
Ouakam – Dakar
2022  2023
Conseillère clientèle
PCCI Dakar
Ouakam – Dakar
2021  2022
FORMATION
2ème année de Formation
ENSUP AFRIQUE
Banque Finance et Assurance
2020  2021
Fatou Sarr
Comptable
fatou.sarr@example.com 77 000 00 00 Ouakam – Dakar
Baccalauréat L2
Lycée Mixte Maurice Delafosse de Dakar
2018  2019
`,
    strict: false,
    expect: {
      fullName: 'Fatou Sarr',
      jobTitle: /comptable/i,
      minExperiences: 3,
      minEducations: 1,
      experiencePositions: [/relations externes/i, /conseillère/i],
    },
  },
  {
    name: 'reel-4-colonnes-experiences-en-fin',
    format: 'CV réel anonymisé : 4 colonnes, résumé en tête, postes/employeurs séparés, en-têtes de section en fin (cas P2 layout)',
    rawText: `
Plombier expérimenté avec plus de 10 ans d'expérience sur des
chantiers variés (bâtiments, industries et hôtellerie).
Modou Fall
Plombier
modou.fall@example.com
(+221) 70 000 00 00
Diorga Montagne, Rufisque - Dakar
COMPÉTENCES
LANGUES
Installation de réseaux de plomberie
Détection et réparation de fuites
Français : lu, parlé et écrit
Anglais : lu, parlé et écrit
Wolof : parlé
2025 à nos jours : Plombier Sous-Traitant
2024 - 2025 : Plombier
2020 - 2021 : Plombier
INDÉPENDANT
ENTREPRISE ESPAGNOLE KALIA, DAKAR
BATILUX, DAKAR
2012 - 2013 : BFEM
EXPÉRIENCES PROFESSIONNELLES
ETUDES ET FORMATIONS
`,
    strict: false,
    expect: {
      fullName: 'Modou Fall',
      jobTitle: /plombier/i,
      email: 'modou.fall@example.com',
      minExperiences: 3,
      minLanguages: 3,
      experiencePositions: [/plombier/i],
    },
  },
]

/** 10 cas manuels + 90 cas générés = corpus de 100 CV de référence. */
export const corpusCases: CorpusCase[] = [...manualCorpusCases, ...generateCorpusCases()]

/** Sous-ensemble annoté pour la validation terrain (cv-samples/). */
export { manualCorpusCases }
