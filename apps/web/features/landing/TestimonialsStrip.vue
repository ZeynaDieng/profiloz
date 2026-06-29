<script setup lang="ts">
const testimonials = [
  {
    name: 'Aminata D.',
    role: 'Responsable marketing',
    quote: 'Mon CV était prêt en moins de 10 minutes. Le PDF est impeccable.',
  },
  {
    name: 'Moussa S.',
    role: 'Développeur junior',
    quote: 'J\'ai importé mon ancien CV et tout s\'est rempli automatiquement.',
  },
  {
    name: 'Fatou N.',
    role: 'Étudiante en master',
    quote: 'Simple, élégant, et enfin un outil pensé pour le mobile.',
  },
] as const

const { target, revealed } = useScrollReveal(0.25)
</script>

<template>
  <section
    ref="target"
    class="border-y border-outline-variant/20 bg-surface-container-lowest/60 py-5 md:py-6 scroll-reveal"
    :class="revealed && 'is-revealed'"
  >
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop">
      <div class="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-gutter sm:overflow-visible scrollbar-none">
        <figure
          v-for="(item, i) in testimonials"
          :key="item.name"
          class="stagger-item mobile-scroll-card-sm shrink-0 sm:shrink rounded-xl border border-outline-variant/20 bg-white/80 px-4 py-3 premium-shadow-sm pz-card"
          :class="revealed && 'is-revealed'"
          :style="revealed ? { transitionDelay: `${i * 90}ms` } : undefined"
        >
          <blockquote class="text-sm text-on-surface leading-snug">{{ item.quote }}</blockquote>
          <figcaption class="mt-2 text-xs text-on-surface-variant">
            <span class="font-semibold text-on-surface">{{ item.name }}</span>
            · {{ item.role }}
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
