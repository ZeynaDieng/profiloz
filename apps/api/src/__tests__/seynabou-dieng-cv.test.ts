import { describe, expect, it } from 'vitest'
import { runResumePipeline } from '../modules/ocr/pipeline'

const SEYNABOU_DIENG_CV = `
Seynabou DIENG - Développeuse Full-stack
Ouakam, Dakar (Sénégal) | +221 77 778 04 56 | zeynash1@gmal.com

Profil Professionnel
Développeuse full-stack avec plus de 4 ans d'expérience spécialisée dans le développement d'applications modernes, performantes et sécurisées. Expertise en frontend et backend avec une approche orientée résultat et expérience utilisateur.

Expérience
Développeuse Full-stack - Intech Group (Oct 2021 - Aujourd'hui)
- Développement complet de plusieurs applications Technologies : Laravel, Angular, Vue.js, Nuxt.js, MySQL, NestJS
- Intégration d'APIs REST sécurisées et optimisation des performances
- Participation aux méthodes Agile avec gestion via Jira

Développeuse Full-stack - Orion (Oct 2024 - Aujourd'hui)
- Développement de modules frontend et interfaces d'administration
- Intégration d'APIs REST et optimisation des performances

Développeuse Web Freelance (Sep 2024 - Aujourd'hui)
- Création de sites vitrines, e-commerce et back-office pour TPE/PME
- Intégration responsive Figma -> code avec Tailwind & Bootstrap
- Hébergement, mise en production, maintenance & SEO technique

Support Technique Multi-entreprises (2019-2024)
- Support utilisateurs, résolution de bugs et maintenance applicative
- Rédaction de documentation technique et guides utilisateurs
- Maintenance matériels informatiques (Change by Intech, Wallo Trading, Ensup Afrique, Zoura, Salam Service)

Formation
- Master en Génie Logiciel - IPD, Dakar (2024-2025, en cours)
- Licence en Informatique (Mention Bien) - ENsup Afrique (2019-2022)
- Certification Développement Web - Bakéli (2023)

Compétences Techniques
- Langages : JavaScript, TypeScript, PHP, HTML5, CSS3, SQL, VB.NET
- Frameworks : Nuxt.js, AngularJS, Laravel, NestJS, Ionic
- UI/Design : Tailwind CSS, Bootstrap, Responsive Design, Filament
- Base de données : MySQL, PostgreSQL
- Outils : Git/GitHub, REST API, Agile/Scrum, Tests unitaires

Langues
- Français : Bien | Anglais : Technique | Wolof : Très bien | Pullar : Les bases

Centres d'intérêt
Codage créatif, hackathons, méditation, veille technologique
`.trim()

describe('Test direct du CV Seynabou DIENG', () => {
  it('extrait correctement l\'ensemble du CV Seynabou DIENG', async () => {
    const result = await runResumePipeline(SEYNABOU_DIENG_CV, { ocrConfidence: 0.9 })

    console.log('=== EXTRACTION RESULT ===')
    console.log('personalInfo:', result.personalInfo)
    console.log('summary:', result.summary)
    console.log('experiences:', result.experiences)
    console.log('educations:', result.educations)
    console.log('skills:', result.skills)
    console.log('languages:', result.languages)
    console.log('interests:', result.interests)

    expect(result.personalInfo?.fullName).toMatch(/Seynabou DIENG/i)
    expect(result.personalInfo?.jobTitle).toMatch(/Développeuse Full-stack/i)
    expect(result.personalInfo?.email).toBe('zeynash1@gmal.com')
    expect(result.personalInfo?.phone).toMatch(/\+221\s*77\s*778\s*04\s*56/)
    expect(result.personalInfo?.location).toMatch(/Ouakam|Dakar/i)
    expect(result.summary).toMatch(/Développeuse full-stack avec plus de 4 ans/i)
    expect(result.experiences?.length).toBeGreaterThanOrEqual(3)
    expect(result.educations?.length).toBeGreaterThanOrEqual(1)
    expect(result.skills?.length).toBeGreaterThanOrEqual(4)
    expect(result.languages?.length).toBeGreaterThanOrEqual(3)
    expect(result.interests?.length).toBeGreaterThanOrEqual(1)
  })
})
