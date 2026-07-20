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

  // ─── Modules ──────────────────────────────────────────────────────
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/seo'],

  css: ['~/assets/css/main.css'],

  // ─── Site SEO (used by @nuxtjs/seo) ──────────────────────────────
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://profiloz.com',
    name: "Profilo'Z",
    description: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF.",
    defaultLocale: 'fr',
  },

  // ─── Sitemap ─────────────────────────────────────────────────────
  sitemap: {
    // Routes dynamiques fournies par server/api/__sitemap__/urls.ts
    // Routes statiques auto-découvertes via le filesystem (par défaut)
    // Exclure les routes privées du sitemap
    exclude: [
      '/connexion',
      '/inscription',
      '/tableau-de-bord/**',
      '/admin/**',
      '/creer/**',
      '/paiement/**',
      '/imprimer/**',
    ],
    // Priorités et fréquences par défaut
    defaults: {
      changefreq: 'weekly',
      priority: 0.8,
    },
  },

  // ─── Robots ──────────────────────────────────────────────────────
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/admin',
          '/tableau-de-bord',
          '/creer',
          '/paiement',
          '/imprimer',
          '/connexion',
          '/inscription',
          '/checkout',
          '/auth',
          '/editor',
          '/pdf',
          '/temp',
          '/compte',
          '/dashboard',
        ],
      },
    ],
  },

  // ─── Schema.org (données structurées) ────────────────────────────
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: "Profilo'Z",
      url: 'https://profiloz.com',
      logo: 'https://profiloz.com/logo.png',
      sameAs: [],
    },
  },

  // ─── OG Image (désactivé pour le moment — pas de serveur Chromium) ─
  ogImage: {
    enabled: false,
  },

  // ─── Runtime Config ──────────────────────────────────────────────
  runtimeConfig: {
    apiInternalBaseUrl: process.env.NUXT_API_INTERNAL_BASE_URL || '',
    public: {
      apiInternalBaseUrl: process.env.NUXT_API_INTERNAL_BASE_URL || '',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001/api/v1',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://profiloz.com',
      /** Hero A/B : "transform" (défaut) ou "start" */
      heroVariant: process.env.NUXT_PUBLIC_HERO_VARIANT || 'transform',
      /** Vidéo démo hero (autoplay). Fichier dans public/demo/ ou URL CMS hero.demoVideoUrl */
      heroDemoVideoUrl: process.env.NUXT_PUBLIC_HERO_DEMO_VIDEO_URL || '/demo/profiloz-hero.mp4',
      /** Image bannière hero (PNG/WebP dans public/ ou URL absolue) */
      heroBannerUrl: process.env.NUXT_PUBLIC_HERO_BANNER_URL || '/landing/hero-banner.png',
      /** Bannière hero mobile (ratio vertical recommandé). Fallback : heroBannerUrl */
      heroBannerMobileUrl: process.env.NUXT_PUBLIC_HERO_BANNER_MOBILE_URL || '',

      // ── Analytics (activables via variable d'environnement) ──────
      /** Google Analytics 4 Measurement ID (ex: G-XXXXXXXXXX) */
      gtagId: process.env.NUXT_PUBLIC_GTAG_ID || '',
      /** Google Tag Manager Container ID (ex: GTM-XXXXXXX) */
      gtmId: process.env.NUXT_PUBLIC_GTM_ID || '',
      /** Microsoft Clarity Project ID */
      clarityId: process.env.NUXT_PUBLIC_CLARITY_ID || '',
      /** Meta / Facebook Pixel ID */
      metaPixelId: process.env.NUXT_PUBLIC_META_PIXEL_ID || '',
      /** Google Ads Conversion ID (ex: AW-XXXXXXXXXX) */
      googleAdsId: process.env.NUXT_PUBLIC_GOOGLE_ADS_ID || '',
      /** Google Search Console verification code */
      gscVerification: process.env.NUXT_PUBLIC_GSC_VERIFICATION || '',
    },
  },

  // ─── Pinia ───────────────────────────────────────────────────────
  pinia: {
    storesDirs: ['stores/**'],
  },

  // ─── Auto-imports ────────────────────────────────────────────────
  imports: {
    dirs: ['composables', 'services'],
  },

  // ─── Components ──────────────────────────────────────────────────
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
    { path: '~/features/admin', prefix: 'Admin' },
  ],

  // ─── Route Rules (indexation + cache + performance) ──────────────
  routeRules: {
    // Puppeteer n'a besoin que du HTML SSR (pas d'hydratation client).
    '/imprimer/**': { ssr: true, noScripts: true, robots: 'noindex, nofollow' },

    // Pages privées — noindex
    '/tableau-de-bord/**': { robots: 'noindex, nofollow' },
    '/admin/**': { robots: 'noindex, nofollow' },
    '/creer/**': { robots: 'noindex, nofollow' },
    '/paiement/**': { robots: 'noindex, nofollow' },
    '/connexion': { robots: 'noindex, nofollow' },
    '/inscription': { robots: 'noindex, nofollow' },

    // Cache assets statiques (fonts, images, JS/CSS bundles)
    '/_nuxt/**': {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  },

  // ─── Nitro (serveur) ─────────────────────────────────────────────
  nitro: {
    // Compression automatique des réponses
    compressPublicAssets: true,
  },

  // ─── Vite ────────────────────────────────────────────────────────
  vite: {
    resolve: {
      dedupe: ['vue'],
    },
  },

  // ─── App (head, transitions) ─────────────────────────────────────
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'fr',
      },
      title: "Profilo'Z | Créateur de CV professionnel",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        {
          name: 'description',
          content: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF.",
        },
        // Theme & branding
        { name: 'theme-color', content: '#6366f1' },
        { name: 'author', content: "Profilo'Z" },
        { name: 'publisher', content: "Profilo'Z" },
        // Open Graph (fallbacks — pages devraient surcharger via useSeoPage)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: "Profilo'Z" },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:image', content: 'https://profiloz.com/logo.png' },
        { property: 'og:title', content: "Profilo'Z | Créateur de CV professionnel" },
        { property: 'og:description', content: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu." },
        // Twitter Cards (fallbacks)
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: "Profilo'Z | Créateur de CV professionnel" },
        { name: 'twitter:description', content: "Le moyen le plus rapide de créer un CV qui donne envie d'être lu." },
        { name: 'twitter:image', content: 'https://profiloz.com/logo.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // Performance: preconnect + dns-prefetch pour Google Fonts
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.gstatic.com',
        },
        // Google Fonts
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
