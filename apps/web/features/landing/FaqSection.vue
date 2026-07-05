<script setup lang="ts">
const fallbackItems = [
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

const { content, load } = useLandingContent()

const items = computed(() => {
  if (content.value.faq.length > 0) {
    return content.value.faq.map((item) => ({ q: item.question, a: item.answer }))
  }
  return fallbackItems.map((item) => ({ q: item.q, a: item.a }))
})

const showAll = ref(false)
const openIndex = ref(0)
const faqHydrated = ref(false)
const { isMobile } = useBreakpoints()
const { target, revealed } = useScrollReveal(0.25)

onMounted(() => {
  load()
  faqHydrated.value = true
})

const visibleItems = computed(() => {
  if (!faqHydrated.value || !isMobile.value || showAll.value) return items.value
  return items.value.slice(0, 2)
})

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <section
    id="faq"
    ref="target"
    class="landing-section bg-surface-container-lowest border-t border-outline-variant/30 scroll-reveal"
    :class="revealed && 'is-revealed'"
  >
    <div class="max-w-2xl mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop">
      <div class="landing-section-header landing-section-header--left">
        <p class="landing-eyebrow">FAQ</p>
        <h2 class="landing-title">Questions fréquentes</h2>
        <p class="landing-lead !max-w-xl">
          Tout ce qu'il faut savoir avant de créer votre dossier.
        </p>
      </div>

      <div class="space-y-3">
        <div
          v-for="(item, index) in visibleItems"
          :key="item.q"
          class="rounded-2xl border border-outline-variant/25 bg-white overflow-hidden premium-shadow-sm"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left min-h-11"
            :aria-expanded="openIndex === index"
            @click="toggle(index)"
          >
            <span class="font-semibold text-on-surface text-sm sm:text-base leading-snug">{{ item.q }}</span>
            <UiPzIcon
              :name="openIndex === index ? 'expand_less' : 'expand_more'"
              class="text-on-surface-variant shrink-0"
            />
          </button>
          <div
            v-show="openIndex === index"
            class="px-5 pb-4 text-sm sm:text-base text-on-surface-variant leading-relaxed border-t border-outline-variant/15"
          >
            {{ item.a }}
          </div>
        </div>
      </div>

      <button
        v-if="isMobile && !showAll && items.length > 2"
        type="button"
        class="mt-5 text-secondary font-bold text-sm hover:underline min-h-11"
        @click="showAll = true"
      >
        Voir toutes les questions
      </button>
    </div>
  </section>
</template>
