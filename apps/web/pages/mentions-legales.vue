<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoPage({
  title: 'Mentions légales',
  description: "Mentions légales du service Profilo'Z.",
})
</script>

<template>
  <UiLegalArticle title="Mentions légales" updated="juin 2026">
    <section>
      <h2>Éditeur du site</h2>
      <p>
        Profilo'Z<br>
        E-mail :
        <a href="mailto:contact@profiloz.fr">contact@profiloz.fr</a>
      </p>
      <p class="text-sm italic">
        [Raison sociale, forme juridique, capital social et adresse du siège social à compléter avant
        publication officielle.]
      </p>
    </section>

    <section>
      <h2>Directeur de la publication</h2>
      <p>[Nom du directeur de publication à compléter.]</p>
    </section>

    <section>
      <h2>Hébergement</h2>
      <p>
        [Nom et coordonnées de l'hébergeur à compléter avant mise en production — ex. fournisseur cloud
        ou VPS utilisé en production.]
      </p>
    </section>

    <section>
      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments graphiques, textuels et logiciels composant Profilo'Z est protégé par le
        droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
      </p>
    </section>

    <section>
      <h2>Données personnelles</h2>
      <p>
        Pour en savoir plus sur le traitement de vos données, consultez notre
        <NuxtLink to="/confidentialite">politique de confidentialité</NuxtLink>.
      </p>
    </section>
  </UiLegalArticle>
</template>
