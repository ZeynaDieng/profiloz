/** URL de l'app Nuxt utilisée par Puppeteer pour /imprimer/cv (réseau interne en Docker). */
export function resolveAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NUXT_PUBLIC_APP_URL ??
    process.env.CORS_ORIGIN?.split(',')[0]?.trim() ??
    'http://127.0.0.1:3000'
  )
}
