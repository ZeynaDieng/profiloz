/**
 * Plugin client pour le chargement conditionnel des scripts analytics.
 *
 * Chaque intégration est activable uniquement via sa variable d'environnement.
 * Si la variable est vide ou absente, le script n'est pas chargé.
 *
 * Scripts supportés :
 * - Google Analytics 4 (GA4) via NUXT_PUBLIC_GTAG_ID
 * - Google Tag Manager (GTM) via NUXT_PUBLIC_GTM_ID
 * - Microsoft Clarity via NUXT_PUBLIC_CLARITY_ID
 * - Meta/Facebook Pixel via NUXT_PUBLIC_META_PIXEL_ID
 * - Google Ads via NUXT_PUBLIC_GOOGLE_ADS_ID
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const gtagId = config.public.gtagId as string
  const gtmId = config.public.gtmId as string
  const clarityId = config.public.clarityId as string
  const metaPixelId = config.public.metaPixelId as string
  const googleAdsId = config.public.googleAdsId as string

  // --- Google Analytics 4 ---
  if (gtagId) {
    useScript({
      src: `https://www.googletagmanager.com/gtag/js?id=${gtagId}`,
      async: true,
    }, {
      trigger: 'idle',
    })
    // Initialiser gtag après chargement
    window.dataLayer = window.dataLayer || []
    function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', gtagId, {
      send_page_view: true,
    })
  }

  // --- Google Tag Manager ---
  if (gtmId) {
    useScript({
      src: `https://www.googletagmanager.com/gtm.js?id=${gtmId}`,
      async: true,
    }, {
      trigger: 'idle',
    })
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js',
    })
  }

  // --- Microsoft Clarity ---
  if (clarityId) {
    useScript({
      innerHTML: `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `,
    }, {
      trigger: 'idle',
    })
  }

  // --- Meta / Facebook Pixel ---
  if (metaPixelId) {
    useScript({
      innerHTML: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `,
    }, {
      trigger: 'idle',
    })
  }

  // --- Google Ads ---
  if (googleAdsId) {
    useScript({
      src: `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`,
      async: true,
    }, {
      trigger: 'idle',
    })
  }
})

// Type augmentation pour window.dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    fbq?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
  }
}
