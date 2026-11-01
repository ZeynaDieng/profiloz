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

    <!-- 5 sections : accroche, modèles, 3 étapes, tarifs + FAQ, appel final.
         Les avis n'apparaissent qu'avec au moins 3 vrais avis validés (admin → Avis clients). -->
    <FeaturesLandingHeroSection />
    <FeaturesLandingTemplatesShowcase />
    <FeaturesLandingTestimonialsStrip />
    <FeaturesLandingStepsSection />
    <FeaturesLandingPricingSection />
    <FeaturesLandingFaqSection />
    <FeaturesLandingCtaSection />
  </div>
</template>
