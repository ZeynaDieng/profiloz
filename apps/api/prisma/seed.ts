import { PrismaClient } from '@prisma/client'
import { TEMPLATE_CATALOG } from '@profiloz/shared'

const prisma = new PrismaClient()

const TEMPLATE_SEED = TEMPLATE_CATALOG.map((t, i) => ({
  slug: t.slug,
  name: t.name,
  category: t.category,
  sortOrder: i + 1,
  previewUrl: `/templates/previews/${t.slug.toLowerCase()}.webp`,
}))

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
