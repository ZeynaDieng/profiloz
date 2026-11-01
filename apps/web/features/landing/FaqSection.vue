<script setup lang="ts">
const fallbackItems = [
  {
    q: 'Est-ce gratuit ?',
    a: 'Créer, modifier et prévisualiser votre CV et vos lettres est gratuit. Vous payez seulement au moment de télécharger le PDF, selon l’offre choisie ci-dessus. Sans abonnement obligatoire.',
  },
  {
    q: 'Que contient un dossier ?',
    a: 'Un dossier, c’est 2 documents au choix : un CV et une lettre de motivation, ou deux CV, ou deux lettres. Vous pouvez les modifier et les retélécharger ensuite.',
  },
  {
    q: 'Comment payer ?',
    a: 'Par mobile money (Orange Money, Wave…) ou carte bancaire, via la plateforme de paiement sécurisée PayTech. Le téléchargement est débloqué dès la confirmation du paiement.',
  },
  {
    q: 'Puis-je importer mon ancien CV ?',
    a: 'Oui : envoyez un PDF, un fichier Word ou une simple photo de votre CV. L’IA remplit automatiquement vos informations, que vous vérifiez avant de continuer.',
  },
  {
    q: 'Les recruteurs pourront-ils lire mon CV ?',
    a: 'Oui. Le PDF est net à l’impression et son texte est lisible par les logiciels de tri des candidatures (ATS) utilisés par de nombreux recruteurs.',
  },
] as const

const { content, load } = useLandingContent()

const items = computed(() => {
  if (content.value.faq.length > 0) {
    return content.value.faq.map((item) => ({ q: item.question, a: item.answer }))
  }
  return fallbackItems.map((item) => ({ q: item.q, a: item.a }))
})

const openIndex = ref(0)
const { target, revealed } = useScrollReveal(0.25)

onMounted(() => {
  load()
})

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <section
    id="faq"
    ref="target"
    class="landing-section bg-surface-container-low scroll-reveal"
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
          v-for="(item, index) in items"
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
    </div>
  </section>
</template>
