export function useWizardDraftInit() {
  const resumeStore = useResumeStore()

  onMounted(() => {
    if (!resumeStore.current?.personalInfo.fullName) {
      resumeStore.rehydrateFromStorage()
    }
    resumeStore.initDraft()
  })
}
