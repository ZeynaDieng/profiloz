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
        class="relative rounded-2xl sm:rounded-3xl border border-outline-variant/25 bg-surface-container-lowest premium-shadow overflow-hidden"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div class="cta-copy p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-center lg:text-left">
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
            <p class="landing-lead mx-auto lg:mx-0 mt-3 sm:mt-4 text-balance">
              Le moyen le plus rapide de créer un CV qui donne envie d'être lu.
            </p>

            <div class="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2 sm:gap-3">
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

            <div class="cta-compare-compact lg:hidden mt-8 text-left">
              <p class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Profilo'Z vs méthodes traditionnelles
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div class="cta-compare-before rounded-xl border border-outline-variant/35 bg-surface-container-low p-3">
                  <p class="text-xs font-bold text-on-surface-variant mb-2">Avant</p>
                  <ul class="space-y-1.5">
                    <li v-for="item in traditional" :key="item" class="flex items-start gap-1.5 text-[11px] text-on-surface-variant leading-snug">
                      <span class="text-on-surface-variant/50 shrink-0" aria-hidden="true">✕</span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
                <div class="cta-compare-after rounded-xl border-2 border-secondary/35 bg-secondary/8 p-3">
                  <p class="text-xs font-bold text-secondary mb-2">Avec Profilo'Z</p>
                  <ul class="space-y-1.5">
                    <li v-for="item in profiloz" :key="item" class="flex items-start gap-1.5 text-[11px] text-on-surface leading-snug">
                      <span class="text-secondary shrink-0 font-bold" aria-hidden="true">✓</span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div
            class="hidden lg:block p-8 sm:p-10 lg:p-12 bg-surface-container-low/80 border-t lg:border-t-0 lg:border-l border-outline-variant/20"
          >
            <p class="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-6">
              Profilo'Z vs méthodes traditionnelles
            </p>

            <div class="grid grid-cols-2 gap-4 sm:gap-5">
              <div class="cta-compare-before rounded-2xl border border-outline-variant/35 bg-surface-container-low p-5">
                <p class="flex items-center gap-2 text-sm font-bold text-on-surface-variant mb-4">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant text-sm">✕</span>
                  Avant
                </p>
                <ul class="space-y-2">
                  <li v-for="item in traditional" :key="item" class="flex items-start gap-2 text-sm text-on-surface-variant">
                    <span class="text-on-surface-variant/45 shrink-0" aria-hidden="true">✕</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div class="cta-compare-after rounded-2xl border-2 border-secondary/40 bg-secondary/10 p-5 premium-shadow-sm">
                <p class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-on-secondary text-sm">✓</span>
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
.cta-copy {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-secondary) 6%, white) 0%,
    white 55%,
    color-mix(in srgb, var(--color-surface-container-low) 80%, white) 100%
  );
}

.cta-compare-after {
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-secondary) 12%, transparent);
}

.cta-primary:hover {
  transform: translateY(-2px);
}

.cta-primary:active,
.cta-secondary:active {
  transform: scale(0.98);
}
</style>
