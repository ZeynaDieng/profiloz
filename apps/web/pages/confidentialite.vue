<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: "Politique de confidentialité | Profilo'Z",
  description: "Politique de confidentialité de Profilo'Z — collecte, utilisation et protection de vos données.",
})
</script>

<template>
  <article class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-secondary font-medium text-sm mb-8 hover:underline">
      <UiPzIcon name="arrow_back" class="text-[18px]" />
      Retour à l'accueil
    </NuxtLink>

    <h1 class="text-3xl font-bold text-on-surface mb-2">Politique de confidentialité</h1>
    <p class="text-sm text-on-surface-variant mb-10">Dernière mise à jour : juin 2026</p>

    <div class="prose-legal space-y-8 text-on-surface-variant leading-relaxed">
      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">1. Responsable du traitement</h2>
        <p>
          Profilo'Z est responsable du traitement des données personnelles collectées via la plateforme
          profiloz.fr et ses sous-domaines associés.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">2. Données collectées</h2>
        <p>Nous pouvons collecter notamment :</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Informations de compte (nom, adresse e-mail) si vous vous inscrivez</li>
          <li>Contenu de votre CV et documents importés (CV, diplômes, attestations)</li>
          <li>Données techniques (logs, adresse IP, type de navigateur) à des fins de sécurité</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">3. Finalités</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Fournir le service de création et d'export de CV</li>
          <li>Extraire et structurer les informations de vos documents importés</li>
          <li>Assurer la sécurité, la maintenance et l'amélioration du service</li>
          <li>Répondre à vos demandes de support</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">4. Mode invité</h2>
        <p>
          En mode invité, une partie de vos données peut être conservée localement dans votre navigateur.
          Les documents importés et PDF générés sont stockés temporairement sur nos serveurs selon les
          durées de conservation applicables.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">5. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de
          limitation, d'opposition et de portabilité. Pour exercer vos droits :
          <a href="mailto:contact@profiloz.fr" class="text-secondary hover:underline">contact@profiloz.fr</a>.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">6. Conservation</h2>
        <p>
          Les données sont conservées le temps nécessaire à la fourniture du service et conformément aux
          obligations légales. Les fichiers temporaires (PDF invité, imports) sont supprimés automatiquement
          après expiration.
        </p>
      </section>
    </div>
  </article>
</template>
