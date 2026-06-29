import { MSG } from '@profiloz/shared'
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
    if (seconds < 10) return "à l'instant"
    if (seconds < 60) return `il y a ${seconds} s`
    const minutes = Math.floor(seconds / 60)
    return `il y a ${minutes} min`
  }

  const statusLabel = computed(() => {
    if (status.value === 'pending') return MSG.save.inProgress
    if (status.value === 'saved' && lastSavedAt.value) {
      return MSG.save.autoSaved(formatTimeAgo(lastSavedAt.value))
    }
    if (status.value === 'error') return errorMessage.value || MSG.save.autoSaveFailed
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
      errorMessage.value = MSG.save.autoSaveFailed
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
