<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: "Mentions légales | Profilo'Z",
  description: "Mentions légales du service Profilo'Z.",
})
</script>

<template>
  <article class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-secondary font-medium text-sm mb-8 hover:underline">
      <UiPzIcon name="arrow_back" class="text-[18px]" />
      Retour à l'accueil
    </NuxtLink>

    <h1 class="text-3xl font-bold text-on-surface mb-2">Mentions légales</h1>
    <p class="text-sm text-on-surface-variant mb-10">Dernière mise à jour : juin 2026</p>

    <div class="prose-legal space-y-8 text-on-surface-variant leading-relaxed">
      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">Éditeur du site</h2>
        <p>
          Profilo'Z<br />
          E-mail :
          <a href="mailto:contact@profiloz.fr" class="text-secondary hover:underline">contact@profiloz.fr</a>
        </p>
        <p class="text-sm italic">
          [Raison sociale, forme juridique, capital social et adresse du siège social à compléter avant
          publication officielle.]
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">Directeur de la publication</h2>
        <p>[Nom du directeur de publication à compléter.]</p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">Hébergement</h2>
        <p>
          [Nom et coordonnées de l'hébergeur à compléter avant mise en production — ex. fournisseur cloud
          ou VPS utilisé en production.]
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments graphiques, textuels et logiciels composant Profilo'Z est protégé par le
          droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">Données personnelles</h2>
        <p>
          Pour en savoir plus sur le traitement de vos données, consultez notre
          <NuxtLink to="/confidentialite" class="text-secondary hover:underline">politique de confidentialité</NuxtLink>.
        </p>
      </section>
    </div>
  </article>
</template>
