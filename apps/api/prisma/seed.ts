import { PrismaClient, TemplateSlug } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATE_SEED = [
  { slug: TemplateSlug.ETUDIANT, name: 'Étudiant', category: 'Entry-level', sortOrder: 1, previewUrl: '/templates/previews/etudiant.webp' },
  { slug: TemplateSlug.PROFESSIONNEL, name: 'Professionnel', category: 'Corporate', sortOrder: 2, previewUrl: '/templates/previews/professionnel.webp' },
  { slug: TemplateSlug.MODERNE, name: 'Moderne', category: 'Creative', sortOrder: 3, previewUrl: '/templates/previews/moderne.webp' },
  { slug: TemplateSlug.DEVELOPPEUR, name: 'Développeur', category: 'Technical', sortOrder: 4, previewUrl: '/templates/previews/developpeur.webp' },
  { slug: TemplateSlug.COMMERCIAL, name: 'Commercial', category: 'Sales', sortOrder: 5, previewUrl: '/templates/previews/commercial.webp' },
  { slug: TemplateSlug.MANAGER, name: 'Manager', category: 'Executive', sortOrder: 6, previewUrl: '/templates/previews/manager.webp' },
  { slug: TemplateSlug.INTERNATIONAL, name: 'International', category: 'Global', sortOrder: 7, previewUrl: '/templates/previews/international.webp' },
  { slug: TemplateSlug.MINIMALISTE, name: 'Minimaliste', category: 'Clean', sortOrder: 8, previewUrl: '/templates/previews/minimaliste.webp' },
  { slug: TemplateSlug.CREATIF, name: 'Créatif', category: 'Artistic', sortOrder: 9, previewUrl: '/templates/previews/creatif.webp' },
  { slug: TemplateSlug.PREMIUM, name: 'Premium', category: 'Exclusive', sortOrder: 10, previewUrl: '/templates/previews/premium.webp' },
  { slug: TemplateSlug.CADRE, name: 'Cadre', category: 'Corporate', sortOrder: 11, previewUrl: '/templates/previews/cadre.webp' },
  { slug: TemplateSlug.EXECUTIF, name: 'Exécutif', category: 'Sales', sortOrder: 12, previewUrl: '/templates/previews/executif.webp' },
  { slug: TemplateSlug.EPURE, name: 'Épuré', category: 'Clean', sortOrder: 13, previewUrl: '/templates/previews/epure.webp' },
  { slug: TemplateSlug.TECH_LEAD, name: 'Tech Lead', category: 'Technical', sortOrder: 14, previewUrl: '/templates/previews/tech_lead.webp' },
  { slug: TemplateSlug.ELEGANCE, name: 'Élégance', category: 'Exclusive', sortOrder: 15, previewUrl: '/templates/previews/elegance.webp' },
  { slug: TemplateSlug.IMPACT, name: 'Impact', category: 'Creative', sortOrder: 16, previewUrl: '/templates/previews/impact.webp' },
  { slug: TemplateSlug.CABINET, name: 'Cabinet', category: 'Corporate', sortOrder: 17, previewUrl: '/templates/previews/cabinet.webp' },
  { slug: TemplateSlug.ACADEMIQUE, name: 'Académique', category: 'Clean', sortOrder: 18, previewUrl: '/templates/previews/academique.webp' },
  { slug: TemplateSlug.ATELIER, name: 'Atelier', category: 'Clean', sortOrder: 19, previewUrl: '/templates/previews/atelier.webp' },
  { slug: TemplateSlug.CLINIQUE, name: 'Clinique', category: 'Corporate', sortOrder: 20, previewUrl: '/templates/previews/clinique.webp' },
  { slug: TemplateSlug.DUOTONE, name: 'DuoTone', category: 'Creative', sortOrder: 21, previewUrl: '/templates/previews/duotone.webp' },
  { slug: TemplateSlug.CHRONOS, name: 'Chronos', category: 'Clean', sortOrder: 22, previewUrl: '/templates/previews/chronos.webp' },
  { slug: TemplateSlug.ATS_FRIENDLY, name: 'ATS Friendly', category: 'Clean', sortOrder: 23, previewUrl: '/templates/previews/ats_friendly.webp' },
]

async function main() {
  for (const template of TEMPLATE_SEED) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    })
  }
  console.log('Seeded', TEMPLATE_SEED.length, 'templates')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
