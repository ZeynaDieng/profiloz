import { useDebounceFn } from '@vueuse/core'

export type AutoSaveStatus = 'idle' | 'pending' | 'saved' | 'error'

export function useAutoSave(options: {
  enabled: Ref<boolean>
  isDirty: Ref<boolean>
  onSave: () => Promise<void>
  intervalMs?: number
}) {
  const status = ref<AutoSaveStatus>('idle')
  const lastSavedAt = ref<number | null>(null)
  const errorMessage = ref('')

  function formatTimeAgo(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 10) return 'à l\'instant'
    if (seconds < 60) return `il y a ${seconds} secondes`
    const minutes = Math.floor(seconds / 60)
    return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const statusLabel = computed(() => {
    if (status.value === 'pending') return 'Sauvegarde en cours…'
    if (status.value === 'saved' && lastSavedAt.value) {
      return `✓ Sauvegardé automatiquement · ${formatTimeAgo(lastSavedAt.value)}`
    }
    if (status.value === 'error') return errorMessage.value || 'Erreur de sauvegarde'
    return ''
  })

  const debouncedSave = useDebounceFn(async () => {
    if (!options.enabled.value || !options.isDirty.value) return

    status.value = 'pending'
    errorMessage.value = ''
    try {
      await options.onSave()
      lastSavedAt.value = Date.now()
      status.value = 'saved'
    } catch {
      status.value = 'error'
      errorMessage.value = 'Sauvegarde automatique échouée'
    }
  }, options.intervalMs ?? 5000)

  watch(
    () => options.isDirty.value,
    (dirty) => {
      if (dirty && options.enabled.value) {
        void debouncedSave()
      }
    },
  )

  return { status, lastSavedAt, statusLabel, triggerSave: debouncedSave }
}
