<script setup lang="ts">
export interface FaqItem {
  question: string
  answer: string
}

const props = withDefaults(
  defineProps<{
    type?: 'organization' | 'webApplication' | 'faqPage' | 'all'
    faqItems?: FaqItem[]
  }>(),
  {
    type: 'all',
    faqItems: () => [],
  },
)

const schemas = computed(() => {
  const list: any[] = []

  // 1. Organization (MATKAM / Profilo'Z)
  if (props.type === 'organization' || props.type === 'all') {
    list.push(
      defineOrganization({
        name: "Profilo'Z",
        legalName: 'MATKAM',
        url: 'https://profiloz.com',
        logo: 'https://profiloz.com/logo.png',
        description: "Profilo'Z est un service en ligne édité par MATKAM pour la création de CV professionnels et de lettres de motivation.",
      }),
    )
  }

  // 2. WebApplication / SoftwareApplication
  if (props.type === 'webApplication' || props.type === 'all') {
    list.push(
      defineWebSite({
        name: "Profilo'Z",
        description: "Créateur de CV et de lettres de motivation en ligne",
        url: 'https://profiloz.com',
        inLanguage: 'fr-FR',
      }),
      defineSoftwareApp({
        name: "Profilo'Z",
        operatingSystem: 'Web',
        applicationCategory: 'BusinessApplication',
        browserRequirements: 'Requires HTML5 and JavaScript',
        description: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF.",
        offers: false as any,
      }),
    )
  }

  // 3. FAQPage
  if ((props.type === 'faqPage' || props.type === 'all') && props.faqItems && props.faqItems.length > 0) {
    props.faqItems.forEach((item) => {
      list.push(
        defineQuestion({
          name: item.question,
          acceptedAnswer: item.answer,
        }),
      )
    })
  }

  return list
})

useSchemaOrg(schemas.value)
</script>

<template>
  <div hidden aria-hidden="true" />
</template>
