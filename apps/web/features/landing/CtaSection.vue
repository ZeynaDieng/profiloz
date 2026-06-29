<script setup lang="ts">
const traditional = [
  'Word compliqué',
  'Mise en page manuelle',
  'CV et lettre séparés',
  'Problèmes ATS',
] as const

const profiloz = [
  'Création guidée',
  'CV + lettre au même endroit',
  'Modèles modernes',
  'Export PDF immédiat',
] as const

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
        class="relative rounded-2xl sm:rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-[0_16px_48px_rgba(49,107,243,0.06)] overflow-hidden"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div class="p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-center lg:text-left">
            <h2 class="text-xl sm:text-3xl lg:text-4xl font-bold text-on-surface leading-tight tracking-tight">
              Votre prochaine opportunité commence ici
            </h2>
            <p class="mt-3 sm:mt-4 text-on-surface-variant text-sm sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
              Le moyen le plus rapide de créer un CV qui donne envie d'être lu.
            </p>

            <div class="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2 sm:gap-3">
              <NuxtLink
                to="/creer"
                class="btn-secondary cta-primary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base shadow-xl"
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
          </div>

          <!-- Comparaison : desktop / tablette paysage uniquement -->
          <div
            class="hidden lg:block p-8 sm:p-10 lg:p-12 bg-surface-container-low/80 border-t lg:border-t-0 lg:border-l border-outline-variant/20"
          >
            <p class="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-6">
              Profilo'Z vs méthodes traditionnelles
            </p>

            <div class="grid grid-cols-2 gap-4 sm:gap-5">
              <div class="rounded-2xl border border-error/20 bg-error/5 p-5">
                <p class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-error/15 text-error text-base">✕</span>
                  Avant
                </p>
                <ul class="space-y-2">
                  <li v-for="item in traditional" :key="item" class="flex items-start gap-2 text-sm text-on-surface-variant">
                    <span class="text-error shrink-0 font-bold" aria-hidden="true">✕</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div class="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-5 shadow-sm">
                <p class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-secondary text-base">✓</span>
                  Avec Profilo'Z
                </p>
                <ul class="space-y-2">
                  <li v-for="item in profiloz" :key="item" class="flex items-start gap-2 text-sm text-on-surface">
                    <span class="text-secondary shrink-0 font-bold" aria-hidden="true">✓</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-primary:hover {
  transform: translateY(-2px);
}

.cta-primary:active,
.cta-secondary:active {
  transform: scale(0.98);
}
</style>
