import { MSG } from '@profiloz/shared'

type FieldValidationError = {
  path: Array<string | number>
  message: string
}

type FieldValidationResult = {
  errors: FieldValidationError[]
}

export function useFormValidation() {
  const fieldErrors = reactive<Record<string, string>>({})
  const formError = ref('')

  function clearAll() {
    for (const key of Object.keys(fieldErrors)) {
      delete fieldErrors[key]
    }
    formError.value = ''
  }

  function setFieldError(key: string, message: string) {
    fieldErrors[key] = message
  }

  function clearField(key: string) {
    delete fieldErrors[key]
    if (Object.keys(fieldErrors).length === 0) {
      formError.value = ''
    }
  }

  function setFromZod(error: FieldValidationResult, summary = MSG.validation.invalidData) {
    clearAll()
    for (const issue of error.errors) {
      const key = String(issue.path[0] ?? '')
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    formError.value = summary
  }

  function hasFieldErrors() {
    return Object.keys(fieldErrors).length > 0
  }

  function scrollToFirstError() {
    nextTick(() => {
      document.querySelector('[data-form-error]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  function fieldError(key: string) {
    return fieldErrors[key] ?? ''
  }

  return {
    fieldErrors,
    formError,
    clearAll,
    setFieldError,
    clearField,
    setFromZod,
    hasFieldErrors,
    scrollToFirstError,
    fieldError,
  }
}
