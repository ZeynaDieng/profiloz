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

onMounted(() => load())

const items = computed(() => {
  if (content.value.faq.length > 0) {
    return content.value.faq.map((item) => ({ q: item.question, a: item.answer }))
  }
  return fallbackItems.map((item) => ({ q: item.q, a: item.a }))
})

const showAll = ref(false)
const openIndex = ref(0)
const { isMobile } = useBreakpoints()
const { target, revealed } = useScrollReveal(0.25)

const visibleItems = computed(() => {
  if (!isMobile.value || showAll.value) return items.value
  return items.value.slice(0, 2)
})

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>
