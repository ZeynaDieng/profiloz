<script setup lang="ts">
const traditional = [
  "Word compliqué",
  "Mise en page manuelle",
  "CV et lettre séparés",
  "Problèmes de compatibilité ATS",
] as const;

const profiloz = [
  "Création guidée",
  "CV + lettre au même endroit",
  "Modèles modernes",
  "Export PDF immédiat",
] as const;
</script>

<template>
  <section
    id="cta-final"
    class="relative py-14 md:py-24 px-margin-mobile md:px-margin-desktop overflow-hidden"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-primary-container via-primary-container to-secondary/15 -z-10"
      aria-hidden="true"
    />
    <div
      class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl -z-10"
      aria-hidden="true"
    />
    <div
      class="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl -z-10"
      aria-hidden="true"
    />

    <div class="max-w-container-max mx-auto">
      <div
        class="relative rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-sm shadow-[0_24px_64px_rgba(15,23,42,0.08)] overflow-hidden"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <!-- Texte + CTAs -->
          <div
            class="p-8 sm:p-10 lg:p-12 flex flex-col justify-center text-center lg:text-left"
          >
            <h2
              class="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface leading-tight tracking-tight"
            >
              Votre prochaine opportunité commence ici
            </h2>
            <p
              class="mt-4 text-on-surface-variant text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
            >
              Créez votre CV et votre lettre de motivation en quelques minutes.
            </p>

            <div
              class="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3"
            >
              <NuxtLink
                to="/creer"
                class="cta-primary inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all"
              >
                Créer ma candidature gratuitement
                <UiPzIcon name="arrow_forward" class="text-[20px]" />
              </NuxtLink>
              <NuxtLink
                to="/creer/modele"
                class="cta-secondary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-on-surface border-2 border-outline-variant/40 bg-white/80 hover:border-secondary hover:text-secondary transition-colors"
              >
                <UiPzIcon name="palette" class="text-[20px]" />
                Voir les modèles
              </NuxtLink>
            </div>
          </div>

          <!-- Comparaison -->
          <div
            class="p-8 sm:p-10 lg:p-12 bg-surface-container-low/80 border-t lg:border-t-0 lg:border-l border-outline-variant/20"
          >
            <p
              class="text-center lg:text-left text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-6"
            >
              Profilo'Z vs méthodes traditionnelles
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div class="rounded-2xl border border-error/20 bg-error/5 p-5">
                <p
                  class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4"
                >
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-error/15 text-error text-base"
                    >✕</span
                  >
                  Avant
                </p>
                <ul class="space-y-3">
                  <li
                    v-for="item in traditional"
                    :key="item"
                    class="flex items-start gap-2.5 text-sm text-on-surface-variant"
                  >
                    <span
                      class="text-error shrink-0 mt-0.5 font-bold"
                      aria-hidden="true"
                      >✕</span
                    >
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div
                class="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-5 shadow-sm"
              >
                <p
                  class="flex items-center gap-2 text-sm font-bold text-on-surface mb-4"
                >
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-secondary text-base"
                    >✓</span
                  >
                  Avec Profilo'Z
                </p>
                <ul class="space-y-3">
                  <li
                    v-for="item in profiloz"
                    :key="item"
                    class="flex items-start gap-2.5 text-sm text-on-surface"
                  >
                    <span
                      class="text-secondary shrink-0 mt-0.5 font-bold"
                      aria-hidden="true"
                      >✓</span
                    >
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
