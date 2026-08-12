<script setup lang="ts">
useSeoPage({
  title: 'Créateur de CV professionnel',
  description:
    "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF.",
  keywords: 'CV, curriculum vitae, créateur de CV, modèle CV, lettre de motivation, PDF, emploi',
})
</script>
<template>
  <div class="landing-page overflow-x-clip max-w-full">
    <SeoStructuredData type="all" />

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
