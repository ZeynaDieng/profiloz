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
