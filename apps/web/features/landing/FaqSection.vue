<script setup lang="ts">
const items = [
  {
    q: "Comment fonctionne l'import de documents ?",
    a: "Notre moteur lit les fichiers PDF et DOCX, identifie expériences, formations et compétences, puis les place dans les champs correspondants de l'éditeur.",
  },
  {
    q: 'Les recruteurs pourront-ils lire mon CV ?',
    a: 'Oui. Chaque modèle est testé pour garantir une excellente lisibilité humaine et une compatibilité avec les principaux ATS du marché.',
  },
  {
    q: 'Puis-je créer une lettre de motivation ?',
    a: "Oui. Profilo'Z permet de rédiger et personnaliser des lettres de motivation, puis de les exporter en PDF. La création de lettres nécessite un compte gratuit pour les sauvegarder et les modifier.",
  },
  {
    q: 'Puis-je télécharger mon CV en PDF ?',
    a: 'Oui, vous pouvez exporter votre CV en PDF haute qualité sans inscription. Un compte permet aussi de sauvegarder CV et lettres.',
  },
] as const

const showAll = ref(false)
const openIndex = ref(0)
const { isMobile } = useBreakpoints()
const { target, revealed } = useScrollReveal(0.25)

const visibleItems = computed(() => {
  if (!isMobile.value || showAll.value) return items
  return items.slice(0, 2)
})

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <section id="faq" class="landing-section bg-white border-t border-outline-variant/30">
    <div
      ref="target"
      class="max-w-3xl mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="landing-section-header text-center">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Questions fréquentes</h2>
      </div>

      <div class="space-y-2">
        <div
          v-for="(item, i) in visibleItems"
          :key="item.q"
          class="faq-item rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 overflow-hidden"
          :class="openIndex === i && 'bg-surface-container-lowest'"
        >
          <button
            type="button"
            class="flex w-full justify-between items-center gap-3 cursor-pointer font-bold text-on-surface min-h-11 px-4 py-3 sm:px-5 sm:py-4 text-left"
            :aria-expanded="openIndex === i"
            @click="toggle(i)"
          >
            <span class="text-sm sm:text-base">{{ item.q }}</span>
            <UiPzIcon
              name="expand_more"
              class="faq-chevron shrink-0 text-on-surface-variant"
              :class="openIndex === i && 'is-open'"
            />
          </button>

          <div class="faq-panel" :class="openIndex === i && 'is-open'">
            <div class="faq-panel__inner">
              <p class="faq-panel__content px-4 pb-4 sm:px-5 sm:pb-5 text-on-surface-variant leading-relaxed text-sm">
                {{ item.a }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="isMobile && !showAll"
        type="button"
        class="mt-4 w-full min-h-11 text-sm font-semibold text-secondary hover:bg-secondary/5 rounded-xl btn-ghost"
        @click="showAll = true"
      >
        Voir toutes les questions ({{ items.length }})
      </button>
    </div>
  </section>
</template>
