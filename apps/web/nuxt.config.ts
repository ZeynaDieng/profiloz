// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  devServer: {
    port: 3000,
    strictPort: true,
  },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    /** URL API joignable depuis le conteneur web (SSR / page d'impression). Vide = utiliser apiBaseUrl public. */
    apiInternalBaseUrl: process.env.NUXT_API_INTERNAL_BASE_URL || '',
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001/api/v1',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      /** Hero A/B : "transform" (défaut) ou "start" */
      heroVariant: process.env.NUXT_PUBLIC_HERO_VARIANT || 'transform',
    },
  },
  pinia: {
    storesDirs: ['stores/**'],
  },
  imports: {
    dirs: ['composables', 'services'],
  },
  components: [
    { path: '~/components/layout', prefix: 'Layout' },
    { path: '~/components/ui', prefix: 'Ui' },
    { path: '~/components/dashboard', prefix: 'Dashboard' },
    { path: '~/components/wizard' },
    { path: '~/components/resume', pathPrefix: true },
    { path: '~/components/cover-letter/templates', prefix: 'CoverLetter' },
    { path: '~/components/cover-letter', prefix: 'CoverLetter', ignore: ['templates/**'] },
    { path: '~/features/landing', prefix: 'FeaturesLanding' },
    { path: '~/features/import', prefix: 'FeatureImport' },
    { path: '~/features/wizard', prefix: 'FeatureWizard' },
    { path: '~/features/editor', prefix: 'FeatureEditor' },
    { path: '~/features/templates', prefix: 'FeatureTemplates' },
    { path: '~/features/cover-letter-templates', prefix: 'FeatureCoverLetterTemplates' },
    { path: '~/features/cover-letter', prefix: 'FeatureCoverLetter' },
  ],
  vite: {
    resolve: {
      dedupe: ['vue'],
    },
  },
  app: {
    head: {
      title: "Profilo'Z | Créateur de CV professionnel",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Créez votre CV et votre lettre de motivation en quelques minutes. Importez vos documents, choisissez un modèle, exportez en PDF.',
        },
        { property: 'og:image', content: '/logo.png' },
        { property: 'og:title', content: "Profilo'Z | Créateur de CV professionnel" },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
        },
      ],
    },
  },
})
