<script setup lang="ts">
useSeoPage({
  title: 'Créateur de CV professionnel',
  description:
    "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF.",
  keywords: 'CV, curriculum vitae, créateur de CV, modèle CV, lettre de motivation, PDF, emploi',
})

// Schema.org — WebSite + SoftwareApplication
useSchemaOrg([
  defineWebSite({
    name: "Profilo'Z",
    description: "Créateur de CV professionnel en ligne",
    url: 'https://profiloz.com',
    inLanguage: 'fr-FR',
  }),
  defineSoftwareApplication({
    name: "Profilo'Z",
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    description: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu.",
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'XOF',
    },
  }),
])
</script>

<template>
  <div class="landing-page overflow-x-clip max-w-full">
    <FeaturesLandingHeroSection />
    <FeaturesLandingTemplatesShowcase />
    <FeaturesLandingTestimonialsStrip />

    <FeaturesLandingFeaturesBento />
    <FeaturesLandingHowItWorksSection />
    <FeaturesLandingApplicationDuoSection />
    <FeaturesLandingPricingSection />
    <FeaturesLandingCtaSection />
  </div>
</template>
