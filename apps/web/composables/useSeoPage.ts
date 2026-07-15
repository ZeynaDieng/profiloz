/**
 * useSeoPage — Composable SEO centralisé pour ProfiloZ
 *
 * Fournit automatiquement tous les meta tags SEO (title, description, canonical,
 * Open Graph, Twitter Cards, robots, language) à partir de paramètres simples.
 *
 * @example
 * ```ts
 * useSeoPage({
 *   title: 'Tarifs',
 *   description: 'Découvrez nos offres...',
 * })
 * ```
 *
 * @example — surcharge complète
 * ```ts
 * useSeoPage({
 *   title: 'Mon article',
 *   description: 'Résumé...',
 *   image: '/blog/mon-article-og.png',
 *   type: 'article',
 *   noindex: false,
 *   keywords: 'cv, emploi',
 *   author: 'ProfiloZ',
 * })
 * ```
 */

export interface SeoPageOptions {
  /** Titre de la page (sans le suffixe site — ajouté automatiquement) */
  title?: string
  /** Meta description */
  description?: string
  /** Image OG/Twitter (chemin relatif ou URL absolue). Défaut: /logo.png */
  image?: string
  /** Type OG : 'website' | 'article' | 'product'. Défaut: 'website' */
  type?: 'website' | 'article' | 'product'
  /** Si true, ajoute noindex,nofollow */
  noindex?: boolean
  /** Keywords meta (optionnel) */
  keywords?: string
  /** Auteur (optionnel) */
  author?: string
  /** URL canonique personnalisée (optionnel — automatique par défaut) */
  canonicalUrl?: string
  /** Date de publication pour les articles */
  publishedTime?: string
  /** Date de modification pour les articles */
  modifiedTime?: string
}

const SITE_NAME = "Profilo'Z"
const SITE_DESCRIPTION = "Le moyen le plus rapide de créer un CV qui donne envie d'être lu. Importez vos documents, choisissez un modèle, exportez en PDF."
const DEFAULT_IMAGE = '/logo.png'
const TWITTER_HANDLE = '@profiloz'
const THEME_COLOR = '#6366f1'
const LOCALE = 'fr_FR'

export function useSeoPage(options: SeoPageOptions = {}) {
  const config = useRuntimeConfig()
  const route = useRoute()

  const siteUrl = config.public.siteUrl as string || config.public.appUrl as string || 'https://profiloz.com'

  // Construire le titre complet
  const fullTitle = options.title
    ? `${options.title} | ${SITE_NAME}`
    : `${SITE_NAME} | Créateur de CV professionnel`

  const description = options.description || SITE_DESCRIPTION

  // URL canonique
  const canonicalUrl = options.canonicalUrl || `${siteUrl}${route.path}`

  // Image OG (URL absolue)
  const rawImage = options.image || DEFAULT_IMAGE
  const imageUrl = rawImage.startsWith('http') ? rawImage : `${siteUrl}${rawImage}`

  // Robots
  const robotsContent = options.noindex ? 'noindex, nofollow' : 'index, follow'

  // Meta SEO via Nuxt composable
  useSeoMeta({
    title: fullTitle,
    description,
    keywords: options.keywords,
    author: options.author || SITE_NAME,
    robots: robotsContent,

    // Open Graph
    ogTitle: fullTitle,
    ogDescription: description,
    ogImage: imageUrl,
    ogUrl: canonicalUrl,
    ogType: options.type || 'website',
    ogSiteName: SITE_NAME,
    ogLocale: LOCALE,

    // Article-specific OG
    ...(options.type === 'article' && options.publishedTime
      ? { articlePublishedTime: options.publishedTime }
      : {}),
    ...(options.type === 'article' && options.modifiedTime
      ? { articleModifiedTime: options.modifiedTime }
      : {}),

    // Twitter Cards
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: description,
    twitterImage: imageUrl,
    twitterSite: TWITTER_HANDLE,
    twitterCreator: TWITTER_HANDLE,
  })

  // Head tags additionnels (canonical, language, theme-color, publisher)
  useHead({
    htmlAttrs: {
      lang: 'fr',
    },
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    meta: [
      { name: 'theme-color', content: THEME_COLOR },
      { name: 'publisher', content: SITE_NAME },
      { property: 'og:locale', content: LOCALE },
    ],
  })
}
