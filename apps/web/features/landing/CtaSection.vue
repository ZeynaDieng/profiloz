<script setup lang="ts">
const { target, revealed } = useScrollReveal(0.25)
</script>

<template>
  <!-- Temps fort de fin de page : bande bleue pleine (sans dégradé), mot clé en ocre -->
  <section
    id="cta-final"
    ref="target"
    class="cta-band landing-section px-margin-mobile md:px-margin-tablet xl:px-margin-desktop scroll-reveal"
    :class="revealed && 'is-revealed'"
  >
    <div class="max-w-container-max mx-auto text-center">
      <p class="cta-band__eyebrow mb-2">Prêt à candidater ?</p>
      <h2 class="landing-title cta-band__title text-balance">
        <span>Votre prochaine </span>
        <span class="cta-band__accent block sm:inline-block min-h-[1.25em]">
          <UiTypewriterText
            tag="span"
            :active="revealed"
            :segments="[{ text: 'opportunité' }]"
            loop
            loop-mode="accent"
          />
        </span>
        <span> commence ici</span>
      </h2>
      <p class="cta-band__lead mx-auto mt-3 sm:mt-4 text-balance">
        Le moyen le plus rapide de créer un CV qui donne envie d'être lu.
      </p>

      <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <NuxtLink
          to="/creer"
          class="cta-band__primary inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold"
        >
          Créer ma candidature
          <UiPzIcon name="arrow_forward" class="text-[20px]" />
        </NuxtLink>
        <NuxtLink
          to="/creer/modele"
          class="cta-band__secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold"
        >
          <UiPzIcon name="palette" class="text-[20px]" />
          Voir les modèles
        </NuxtLink>
      </div>

      <p class="cta-band__note mt-4 text-xs sm:text-sm">
        Gratuit pour commencer · PDF en quelques minutes
      </p>
    </div>
  </section>
</template>

<style scoped>
.cta-band {
  background: var(--color-secondary);
  color: #fff;
}

.cta-band__eyebrow {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.75);
}

.cta-band__title {
  color: #fff;
}

/* Ocre éclairci : l'ocre de la marque n'a pas assez de contraste sur ce bleu (≈ 2,7:1) */
.cta-band__accent {
  color: #ffbe5c;
}

.cta-band__lead {
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(255 255 255 / 0.85);
}

.cta-band__note {
  color: rgb(255 255 255 / 0.75);
}

.cta-band__primary {
  background: #fff;
  color: var(--color-secondary);
  transition: transform 0.2s ease;
}

.cta-band__secondary {
  border: 2px solid rgb(255 255 255 / 0.7);
  color: #fff;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.cta-band__secondary:hover {
  background: rgb(255 255 255 / 0.1);
}

.cta-band__primary:hover {
  transform: translateY(-2px);
}

.cta-band__primary:active,
.cta-band__secondary:active {
  transform: scale(0.98);
}
</style>
