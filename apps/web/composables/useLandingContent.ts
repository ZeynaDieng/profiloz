export interface LandingContent {
  locale: string
  sections: Record<string, Record<string, unknown>>
  faq: Array<{ id: string; question: string; answer: string }>
}

const defaultContent: LandingContent = {
  locale: 'fr-FR',
  sections: {},
  faq: [],
}

export function useLandingContent() {
  const config = useRuntimeConfig()
  const content = useState<LandingContent>('landing-content', () => defaultContent)
  const loaded = useState('landing-content-loaded', () => false)

  async function load(locale = 'fr-FR') {
    if (loaded.value && content.value.locale === locale) return content.value
    try {
      const data = await $fetch<LandingContent>(`${config.public.apiBaseUrl}/content/landing?locale=${locale}`)
      content.value = data
      loaded.value = true
      return data
    } catch {
      loaded.value = true
      return content.value
    }
  }

  function section<T extends Record<string, unknown>>(key: string): T {
    return (content.value.sections[key] ?? {}) as T
  }

  return { content, load, section }
}
