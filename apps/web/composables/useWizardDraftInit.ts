export function useWizardDraftInit() {
  const resumeStore = useResumeStore()

  onMounted(() => {
    if (!resumeStore.current?.personalInfo.fullName) {
      resumeStore.rehydrateFromStorage()
    }
    if (!resumeStore.current?.personalInfo.fullName?.trim()) {
      resumeStore.loadDemoPersona()
    } else {
      resumeStore.initDraft()
    }
  })
}
