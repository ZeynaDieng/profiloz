<script setup lang="ts">
useSeoPage({
  title: 'Questions fréquentes',
  description:
    "Tout ce qu'il faut savoir avant de créer votre dossier CV et lettre de motivation sur Profilo'Z.",
  keywords: 'FAQ, questions fréquentes, aide, CV, lettre de motivation',
})

const faqItems = [
  {
    question: "Comment fonctionne l'import de documents ?",
    answer:
      "Notre moteur lit les fichiers PDF et DOCX, identifie expériences, formations et compétences, puis les place dans les champs correspondants de l'éditeur.",
  },
  {
    question: 'Les recruteurs pourront-ils lire mon CV ?',
    answer:
      'Oui. Chaque modèle est testé pour garantir une excellente lisibilité humaine et une compatibilité avec les principaux ATS du marché.',
  },
  {
    question: 'Puis-je créer une lettre de motivation ?',
    answer:
      "Oui. Profilo'Z permet de rédiger et personnaliser des lettres de motivation, puis de les exporter en PDF.",
  },
  {
    question: 'Puis-je télécharger mon CV en PDF ?',
    answer:
      'Oui, vous pouvez exporter votre CV en PDF haute qualité sans inscription. Un compte permet aussi de sauvegarder CV et lettres.',
  },
]
</script>

<template>
  <div class="overflow-x-clip max-w-full">
    <SeoStructuredData type="faqPage" :faq-items="faqItems" />
    <FeaturesLandingFaqSection />
  </div>
</template>
