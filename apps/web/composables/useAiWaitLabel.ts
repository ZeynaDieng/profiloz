import type { Ref } from 'vue'

/**
 * Libellé d'attente des actions IA (10 à 25 s) : affiche le temps écoulé
 * pour que l'utilisateur voie que la rédaction avance.
 */
export function useAiWaitLabel(loading: Ref<boolean>) {
  const elapsed = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  watch(loading, (isLoading) => {
    if (timer) clearInterval(timer)
    elapsed.value = 0
    if (isLoading && import.meta.client) {
      timer = setInterval(() => { elapsed.value += 1 }, 1000)
    }
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return computed(() => {
    if (elapsed.value < 2) return 'Génération…'
    if (elapsed.value < 20) return `L’IA rédige… ${elapsed.value} s`
    return `Presque terminé… ${elapsed.value} s`
  })
}
