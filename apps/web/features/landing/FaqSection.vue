<template>
  <section id="faq" class="py-12 md:py-24 bg-white border-t border-outline-variant/30">
    <div class="max-w-3xl mx-auto px-margin-mobile">
      <div class="text-center mb-12">
        <h2 class="text-2xl font-bold text-on-surface">Questions fréquentes</h2>
      </div>
      <div class="space-y-6">
        <details class="group border-b border-outline-variant pb-6" open>
          <summary class="flex justify-between items-center cursor-pointer list-none font-bold text-on-surface">
            <span>Comment fonctionne l'import de documents ?</span>
            <UiPzIcon name="expand_more" class="transition-transform group-open:rotate-180" />
          </summary>
          <p class="mt-4 text-on-surface-variant leading-relaxed">
            Notre moteur lit les fichiers PDF et DOCX, identifie expériences, formations et compétences, puis les place dans les champs correspondants de l'éditeur.
          </p>
        </details>
        <details class="group border-b border-outline-variant pb-6">
          <summary class="flex justify-between items-center cursor-pointer list-none font-bold text-on-surface">
            <span>Les recruteurs pourront-ils lire mon CV ?</span>
            <UiPzIcon name="expand_more" class="transition-transform group-open:rotate-180" />
          </summary>
          <p class="mt-4 text-on-surface-variant leading-relaxed">
            Oui. Chaque modèle est testé pour garantir une excellente lisibilité humaine et une compatibilité avec les principaux ATS du marché.
          </p>
        </details>
        <details class="group border-b border-outline-variant pb-6">
          <summary class="flex justify-between items-center cursor-pointer list-none font-bold text-on-surface">
            <span>Puis-je télécharger mon CV en PDF ?</span>
            <UiPzIcon name="expand_more" class="transition-transform group-open:rotate-180" />
          </summary>
          <p class="mt-4 text-on-surface-variant leading-relaxed">
            Oui, vous pouvez exporter votre CV en PDF haute qualité. La création de compte permet de sauvegarder et modifier vos CV ultérieurement.
          </p>
        </details>
      </div>
    </div>
  </section>
</template>
