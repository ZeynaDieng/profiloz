<script setup lang="ts">
const { target, revealed } = useScrollReveal(0.25)
</script>

<template>
  <section
    id="cta-final"
    ref="target"
    class="landing-section relative px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden scroll-reveal bg-white border-t border-outline-variant/30"
    :class="revealed && 'is-revealed'"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-background to-secondary/5 -z-10 pointer-events-none"
      aria-hidden="true"
    />

    <div class="max-w-container-max mx-auto">
      <div
        class="relative rounded-2xl sm:rounded-3xl border border-outline-variant/25 bg-surface-container-lowest premium-shadow overflow-hidden"
      >
        <div class="grid grid-cols-1 gap-0">
          <div class="cta-copy p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-center">
            <p class="landing-eyebrow mb-2">Prêt à candidater ?</p>
            <h2 class="landing-title text-balance">
              <span>Votre prochaine </span>
              <span class="block sm:inline-block text-secondary min-h-[1.25em]">
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
            <p class="landing-lead mx-auto mt-3 sm:mt-4 text-balance">
              Le moyen le plus rapide de créer un CV qui donne envie d'être lu.
            </p>

            <div class="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
              <NuxtLink
                to="/creer"
                class="btn-secondary cta-primary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base premium-shadow-sm"
              >
                Créer ma candidature
                <UiPzIcon name="arrow_forward" class="text-[20px]" />
              </NuxtLink>
              <NuxtLink
                to="/creer/modele"
                class="btn-outline cta-secondary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base bg-white/80"
              >
                <UiPzIcon name="palette" class="text-[20px]" />
                Voir les modèles
              </NuxtLink>
            </div>

            <p class="mt-4 text-xs sm:text-sm text-on-surface-variant">
              Gratuit pour commencer · PDF en quelques minutes
            </p>

          </div>

          <div
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-copy {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-secondary) 6%, white) 0%,
    white 55%,
    color-mix(in srgb, var(--color-surface-container-low) 80%, white) 100%
  );
}


.cta-primary:hover {
  transform: translateY(-2px);
}

.cta-primary:active,
.cta-secondary:active {
  transform: scale(0.98);
}
</style>
