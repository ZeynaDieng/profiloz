export const RESUME_EDITOR_VALIDATION_KEY = Symbol('resumeEditorValidation')

export type ResumeEditorValidationApi = {
  validateAll: () => boolean
  scrollToFirstError: () => void
}

export function provideResumeEditorValidation(api: ResumeEditorValidationApi) {
  provide(RESUME_EDITOR_VALIDATION_KEY, api)
}

export function useResumeEditorValidation() {
  return inject<ResumeEditorValidationApi | null>(RESUME_EDITOR_VALIDATION_KEY, null)
}
