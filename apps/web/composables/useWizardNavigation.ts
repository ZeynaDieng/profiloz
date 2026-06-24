export const WIZARD_ROUTES = [
  { step: 1, path: '/creer/assistant/informations', label: 'Informations' },
  { step: 2, path: '/creer/assistant/parcours', label: 'Parcours' },
  { step: 3, path: '/creer/assistant/qualifications', label: 'Qualifications' },
] as const

export const FLOW_STEPS = [
  ...WIZARD_ROUTES,
  { step: 4, path: '/creer/modele', label: 'Modèle' },
  { step: 5, path: '/creer/editeur', label: 'Prévisualisation' },
] as const

export function useWizardNavigation() {
  const route = useRoute()

  const currentIndex = computed(() =>
    WIZARD_ROUTES.findIndex((r) => r.path === route.path),
  )

  const current = computed(() => WIZARD_ROUTES[currentIndex.value] ?? WIZARD_ROUTES[0])
  const prev = computed(() => WIZARD_ROUTES[currentIndex.value - 1])
  const next = computed(() => WIZARD_ROUTES[currentIndex.value + 1])

  function goNext() {
    if (next.value) navigateTo(next.value.path)
    else navigateTo('/creer/modele')
  }

  function goBack() {
    if (prev.value) navigateTo(prev.value.path)
    else navigateTo('/creer')
  }

  return { current, prev, next, goNext, goBack, currentIndex }
}
