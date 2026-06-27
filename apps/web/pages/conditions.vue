<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: "Conditions d'utilisation | Profilo'Z",
  description: "Conditions générales d'utilisation du service Profilo'Z.",
})
</script>

<template>
  <article class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-secondary font-medium text-sm mb-8 hover:underline">
      <UiPzIcon name="arrow_back" class="text-[18px]" />
      Retour à l'accueil
    </NuxtLink>

    <h1 class="text-3xl font-bold text-on-surface mb-2">Conditions d'utilisation</h1>
    <p class="text-sm text-on-surface-variant mb-10">Dernière mise à jour : juin 2026</p>

    <div class="prose-legal space-y-8 text-on-surface-variant leading-relaxed">
      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">1. Objet</h2>
        <p>
          Les présentes conditions régissent l'accès et l'utilisation de Profilo'Z, service en ligne de
          création, d'édition et d'export de curriculum vitae au format PDF.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">2. Accès au service</h2>
        <p>
          Le service est accessible en mode invité ou via un compte utilisateur. Vous vous engagez à
          fournir des informations exactes et à ne pas utiliser le service à des fins illicites ou
          frauduleuses.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">3. Contenu utilisateur</h2>
        <p>
          Vous conservez la propriété du contenu que vous importez ou saisissez. Vous nous accordez une
          licence limitée permettant de traiter ce contenu aux seules fins de fourniture du service
          (extraction, mise en forme, génération PDF).
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">4. Disponibilité</h2>
        <p>
          Nous nous efforçons d'assurer une disponibilité continue du service, sans garantie d'absence
          d'interruption. Des opérations de maintenance peuvent être réalisées sans préavis.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">5. Limitation de responsabilité</h2>
        <p>
          Profilo'Z est un outil d'aide à la rédaction. Nous ne garantissons pas l'obtention d'un entretien
          ou d'un emploi. L'utilisateur reste responsable du contenu publié et des documents transmis aux
          recruteurs.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">6. Résiliation</h2>
        <p>
          Vous pouvez cesser d'utiliser le service à tout moment. Nous pouvons suspendre un compte en cas de
          violation des présentes conditions ou d'usage abusif.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-on-surface">7. Contact</h2>
        <p>
          Pour toute question :
          <a href="mailto:contact@profiloz.fr" class="text-secondary hover:underline">contact@profiloz.fr</a>.
        </p>
      </section>
    </div>
  </article>
</template>
