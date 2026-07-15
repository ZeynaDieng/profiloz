/**
 * Server route pour fournir les URLs dynamiques au sitemap.
 *
 * Actuellement retourne un tableau vide — prêt à être connecté
 * aux futures sources de données (modèles CV, lettres, blog, métiers).
 *
 * Le module nuxt-simple-sitemap appelle automatiquement cette route
 * et fusionne les résultats avec les routes statiques auto-découvertes.
 *
 * @see https://nuxtseo.com/sitemap/guides/dynamic-urls
 */
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  /**
   * Sources dynamiques futures — décommenter et adapter quand l'API est prête.
   *
   * Chaque source doit retourner un tableau d'objets :
   * { loc: string, lastmod?: string, changefreq?: string, priority?: number }
   */

  // -------------------------------------------------------------------
  // 1. Articles de blog
  // -------------------------------------------------------------------
  // const blogPosts = await $fetch<{ data: Array<{ slug: string; updatedAt: string }> }>(
  //   `${process.env.NUXT_PUBLIC_API_BASE_URL}/content/blog`,
  // ).catch(() => ({ data: [] }))
  //
  // const blogUrls = blogPosts.data.map((post) => ({
  //   loc: `/blog/${post.slug}`,
  //   lastmod: post.updatedAt,
  //   changefreq: 'weekly' as const,
  //   priority: 0.7,
  // }))

  // -------------------------------------------------------------------
  // 2. Modèles de CV (futur — 1000+)
  // -------------------------------------------------------------------
  // const cvTemplates = await $fetch<{ data: Array<{ slug: string }> }>(
  //   `${process.env.NUXT_PUBLIC_API_BASE_URL}/templates/cv`,
  // ).catch(() => ({ data: [] }))
  //
  // const cvUrls = cvTemplates.data.map((tpl) => ({
  //   loc: `/modeles/cv/${tpl.slug}`,
  //   changefreq: 'monthly' as const,
  //   priority: 0.6,
  // }))

  // -------------------------------------------------------------------
  // 3. Lettres de motivation (futur — 1000+)
  // -------------------------------------------------------------------
  // const letters = await $fetch<{ data: Array<{ slug: string }> }>(
  //   `${process.env.NUXT_PUBLIC_API_BASE_URL}/templates/letters`,
  // ).catch(() => ({ data: [] }))
  //
  // const letterUrls = letters.data.map((l) => ({
  //   loc: `/lettres/${l.slug}`,
  //   changefreq: 'monthly' as const,
  //   priority: 0.6,
  // }))

  // -------------------------------------------------------------------
  // 4. Métiers (futur — 1000+)
  // -------------------------------------------------------------------
  // const jobs = await $fetch<{ data: Array<{ slug: string }> }>(
  //   `${process.env.NUXT_PUBLIC_API_BASE_URL}/jobs`,
  // ).catch(() => ({ data: [] }))
  //
  // const jobUrls = jobs.data.map((j) => ({
  //   loc: `/metiers/${j.slug}`,
  //   changefreq: 'monthly' as const,
  //   priority: 0.5,
  // }))

  // -------------------------------------------------------------------
  // Fusionner toutes les sources
  // -------------------------------------------------------------------
  return [
    // ...blogUrls,
    // ...cvUrls,
    // ...letterUrls,
    // ...jobUrls,
  ]
})
