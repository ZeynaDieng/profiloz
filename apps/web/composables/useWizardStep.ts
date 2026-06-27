export interface WizardStepConfig {
  nextLabel: string
  showBack: boolean
  showSkip: boolean
  skipLabel: string
  loading: boolean
}

export interface WizardStepHandlers {
  onContinue?: () => void | Promise<void>
  onSkip?: () => void | Promise<void>
}

/** Options accepted by wizard pages (includes non-serializable handlers). */
export type WizardStepOptions = Partial<WizardStepConfig & WizardStepHandlers>

const WIZARD_STEP_STATE_KEY = 'wizard-step-config'

export const wizardStepDefaults: WizardStepConfig = {
  nextLabel: 'Continuer',
  showBack: true,
  showSkip: false,
  skipLabel: 'Passer',
  loading: false,
}

function useWizardStepHandlersRef() {
  const nuxtApp = useNuxtApp()
  const key = '_wizardStepHandlers' as const
  if (!nuxtApp[key]) {
    nuxtApp[key] = shallowRef<WizardStepHandlers>({})
  }
  return nuxtApp[key]
}

export function useWizardStepState() {
  return useState<WizardStepConfig>(WIZARD_STEP_STATE_KEY, () => ({ ...wizardStepDefaults }))
}

export function useWizardStepHandlers() {
  return useWizardStepHandlersRef()
}

export function useWizardStep(options: MaybeRefOrGetter<WizardStepOptions>) {
  const config = useWizardStepState()
  const handlers = useWizardStepHandlersRef()

  function applyConfig() {
    const opts = toValue(options)
    config.value = {
      nextLabel: opts.nextLabel ?? wizardStepDefaults.nextLabel,
      showBack: opts.showBack ?? wizardStepDefaults.showBack,
      showSkip: opts.showSkip ?? wizardStepDefaults.showSkip,
      skipLabel: opts.skipLabel ?? wizardStepDefaults.skipLabel,
      loading: opts.loading ?? wizardStepDefaults.loading,
    }
    handlers.value = {
      onContinue: opts.onContinue,
      onSkip: opts.onSkip,
    }
  }

  // Register after the previous page unmounts (it used to clear handlers on unmount).
  onMounted(() => {
    applyConfig()
  })

  watch(() => toValue(options), applyConfig, { deep: true })

  onUnmounted(() => {
    config.value = { ...wizardStepDefaults }
  })
}

declare module '#app' {
  interface NuxtApp {
    _wizardStepHandlers?: ShallowRef<WizardStepHandlers>
  }
}
