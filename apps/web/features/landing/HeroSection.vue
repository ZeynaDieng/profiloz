<script setup lang="ts">
const config = useRuntimeConfig()
const { content, load, section } = useLandingContent()

onMounted(() => {
  load()
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const heroVariant = computed(() =>
  (config.public.heroVariant as string) === 'start' ? 'start' : 'transform',
)

const hero = computed(() => section<{
  titleTransform?: string
  titleStart?: string
  subtitle?: string
  ctaPrimary?: string
  ctaPrimaryLink?: string
  journeySteps?: string[]
}>('hero'))

const heroBannerSrc = computed(
  () => (config.public.heroBannerUrl as string)?.trim() || '/landing/hero-banner.png',
)

// Prefer a dedicated mobile crop when one is configured (sharper: it's sized
// for a narrow/tall viewport instead of a wide desktop banner). Otherwise fall
// back to the desktop photo so mobile still shows an image, accepting that a
// wide crop stretched via `cover` will look a little softer until a real
// mobile asset is provided.
const heroBannerMobileUrlRaw = computed(() => (config.public.heroBannerMobileUrl as string)?.trim())
const hasMobilePhoto = computed(() => true)
const heroBannerMobileSrc = computed(() => heroBannerMobileUrlRaw.value || heroBannerSrc.value)

// Preload the LCP image only for the viewport(s) that will actually render one.
useHead({
  link: [
    ...(hasMobilePhoto.value
      ? [{
          rel: 'preload',
          as: 'image',
          href: heroBannerMobileSrc.value,
          media: '(max-width: 1023px)',
          fetchpriority: 'high',
        }]
      : []),
    {
      rel: 'preload',
      as: 'image',
      href: heroBannerSrc.value,
      media: '(min-width: 1024px)',
      fetchpriority: 'high',
    },
  ],
})

const heroBannerStyle = computed(() => ({
  '--hero-banner-image': `url('${heroBannerSrc.value}')`,
  // 'none' when no dedicated mobile asset exists, so the mobile background
  // layer falls back to the plain gradient instead of a stretched, blurry photo.
  '--hero-banner-image-mobile': hasMobilePhoto.value ? `url('${heroBannerMobileSrc.value}')` : 'none',
}))

const heroLines = computed(() => {
  // Accroche mobile allégée (priorité produit) — le CMS peut encore surcharger via admin si besoin
  const custom =
    heroVariant.value === 'transform'
      ? hero.value.titleTransform?.trim()
      : hero.value.titleStart?.trim()

  const fallback = ['Modèles professionnels de CV', 'et lettre de motivation'] as const

  if (!custom) return [...fallback]

  // Anciennes accroches CMS → remplacer par la nouvelle formulation
  const legacyTitles = [
    'Créez votre CV et votre lettre de motivation en quelques minutes.',
    'Créez un CV et une lettre en quelques minutes.',
    "Tout ce qu'il faut pour réussir votre candidature.",
  ]
  if (legacyTitles.some((t) => custom === t || custom.startsWith(t.slice(0, 40)))) {
    return [...fallback]
  }

  const dot = custom.indexOf('.')
  if (dot > 0 && dot < custom.length - 2) {
    return [custom.slice(0, dot + 1).trim(), custom.slice(dot + 1).trim()]
  }
  return [custom, '']
})

// Shorter first line for small screens only. Only kicks in for the default
// fallback title — a custom CMS title is short enough already or can't be
// safely shortened automatically, so it's reused as-is on mobile too.
const heroFirstLineShort = computed(() => {
  const fallbackFirstLine = 'Modèles professionnels de CV'
  return heroLines.value[0] === fallbackFirstLine ? 'Modèles de CV' : heroLines.value[0]
})

const heroPills = ['Import IA & Photo', 'Compatible ATS', 'Générateur de Lettre'] as const
const defaultSubtitle =
  "Profilo'Z réunit l'IA d'importation, l'éditeur de CV et la création de lettres au même endroit."

const legacySubtitles = [
  "Profilo'Z réunit CV, lettres de motivation, modèles professionnels et export PDF. L'ensemble de votre dossier de candidature, au même endroit.",
  "Profilo'Z réunit modèles professionnels, éditeur guidé et export PDF. Votre dossier complet, au même endroit.",
]

const heroSubtitle = computed(() => {
  const custom = hero.value.subtitle?.trim()
  if (!custom || legacySubtitles.includes(custom)) return defaultSubtitle
  return custom
})

// Shorter phrasing for small screens only — sm: and up still use heroSubtitle.
// If the CMS doesn't provide a dedicated short version, fall back to a
// deliberately brief default rather than truncating the long one mid-sentence.
const defaultSubtitleShort = "L'IA d'importation, l'éditeur de CV et les lettres, au même endroit."

const heroSubtitleShort = computed(() => {
  const customShort = (hero.value as { subtitleShort?: string }).subtitleShort?.trim()
  return customShort || defaultSubtitleShort
})

const heroLine2 = computed(() => heroLines.value[1] ?? '')

const reducedMotion = ref(false)
// Show everything immediately if there's no second line, or if the user asked for reduced motion.
const heroCopyVisible = ref(false)

watch(
  [heroLine2, reducedMotion],
  ([line, reduced]) => {
    if (!line || reduced) heroCopyVisible.value = true
  },
  { immediate: true },
)

function onHeroTitleComplete() {
  heroCopyVisible.value = true
}
</script>

<template>
  <section
    class="hero-banner relative overflow-hidden flex items-center min-h-[26rem] py-10 lg:min-h-[clamp(22rem,66.6vw,42.625rem)] lg:py-[clamp(2.5rem,5vw,3.75rem)] [@media(max-height:450px)_and_(orientation:landscape)]:min-h-[20rem] [@media(max-height:450px)_and_(orientation:landscape)]:py-6"
    :style="heroBannerStyle"
  >
    <!--
      Background layer.
      Mobile: brand gradients only (or the dedicated mobile photo, if one is configured).
      Desktop (lg:): the full banner photo.
    -->
    <div
      aria-hidden="true"
      class="absolute inset-0 z-0 pointer-events-none bg-[#f7f9ff]
             bg-[image:var(--hero-banner-image-mobile),radial-gradient(at_0%_0%,rgba(49,107,243,0.06)_0px,transparent_55%),radial-gradient(at_100%_0%,rgba(113,248,228,0.1)_0px,transparent_55%)]
             bg-[position:center_35%,center,center] bg-[size:cover,100%_100%,100%_100%] bg-no-repeat
             lg:bg-[image:var(--hero-banner-image),radial-gradient(at_0%_0%,rgba(49,107,243,0.04)_0px,transparent_50%),radial-gradient(at_100%_0%,rgba(113,248,228,0.06)_0px,transparent_50%)]
             lg:bg-[position:top_center,center,center] lg:bg-[size:100%_auto,100%_100%,100%_100%]"
    />

    <!-- Scrim: only meaningful over a photo, so it's inert (no visible photo) on mobile without one, and fades the desktop photo on the left. -->
    <div
      aria-hidden="true"
      class="absolute inset-0 z-[1] pointer-events-none
             bg-[image:linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.85)_40%,rgba(255,255,255,0.4)_65%,transparent_90%)]"
    />

    <div
      class="relative z-[2] w-full max-w-container-max mx-auto px-0 lg:px-margin-desktop md:px-margin-tablet grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center"
    >
      <div
        class="flex flex-col text-left lg:max-w-[31rem] mx-auto lg:mx-0 min-w-0 max-w-full"
      >
        <h1
          class="landing-display flex flex-col gap-[0.2rem] text-balance
                 text-[1.375rem] sm:text-2xl lg:text-4xl"
        >
          <span class="sm:hidden block leading-[1.14] break-words [hyphens:auto] text-on-surface">
            {{ heroFirstLineShort }}
          </span>
          <span class="hidden sm:block leading-[1.14] break-words [hyphens:auto] text-on-surface">
            {{ heroLines[0] }}
          </span>
          <span
            v-if="heroLine2"
            class="block leading-[1.14] break-words [hyphens:auto] min-h-[1.2em] mt-0.5 text-secondary"
          >
            <span v-if="reducedMotion">{{ heroLine2 }}</span>
            <UiTypewriterText
              v-else
              tag="span"
              :segments="[{ text: heroLine2 }]"
              loop
              loop-mode="full"
              @complete="onHeroTitleComplete"
            />
          </span>
        </h1>

        <p
          class="landing-lead sm:hidden mx-auto lg:mx-0 mt-3 md:mt-4 text-balance order-2
                 transition-opacity duration-500 ease-out motion-reduce:transition-none"
          :class="heroCopyVisible ? 'opacity-100' : 'opacity-0'"
          style="transition-delay: 150ms"
        >
          {{ heroSubtitleShort }}
        </p>
        <p
          class="landing-lead hidden sm:block mx-auto lg:mx-0 mt-3 md:mt-4 text-balance order-2
                 transition-opacity duration-500 ease-out motion-reduce:transition-none"
          :class="heroCopyVisible ? 'opacity-100' : 'opacity-0'"
          style="transition-delay: 150ms"
        >
          {{ heroSubtitle }}
        </p>

        <!-- items-start from the mobile breakpoint up: this is what stops the button from stretching full-width -->
        <div
          class="order-3 lg:order-4 mt-6 flex flex-col sm:flex-row items-start justify-center lg:justify-start gap-3
                 transition-opacity duration-500 ease-out motion-reduce:transition-none"
          :class="heroCopyVisible ? 'opacity-100' : 'opacity-0'"
          style="transition-delay: 300ms"
        >
          <NuxtLink
            :to="hero.ctaPrimaryLink || '/creer'"
            class="self-start bg-secondary text-on-secondary px-4 py-3 rounded-2xl premium-shadow-sm text-sm"
          >
            {{ hero.ctaPrimary || 'Commencer gratuitement' }}
          </NuxtLink>
        </div>

        <div
          class="order-4 lg:order-3 mt-5 flex flex-wrap items-center justify-start gap-x-4 gap-y-2.5 sm:gap-x-5 sm:gap-y-2 transition-opacity duration-500 ease-out motion-reduce:transition-none"
          :class="heroCopyVisible ? 'opacity-100' : 'opacity-0'"
          style="transition-delay: 450ms"
        >
          <!-- Item 1: Import -->
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 shrink-0">
            <span class="w-4 h-4 rounded-full bg-[#EEF4FF] border border-[#2563eb]/20 text-[#2563eb] flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
            <span class="sm:hidden">Import</span>
            <span class="hidden sm:inline">Import IA & Photo</span>
          </span>

          <!-- Item 2: Compatible ATS -->
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 shrink-0">
            <span class="w-4 h-4 rounded-full bg-[#EEF4FF] border border-[#2563eb]/20 text-[#2563eb] flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
            <span>Compatible ATS</span>
          </span>

          <!-- Saut de ligne uniquement sur mobile -->
          <div class="w-full h-0 sm:hidden" aria-hidden="true" />

          <!-- Item 3: Générateur de Lettre -->
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 shrink-0">
            <span class="w-4 h-4 rounded-full bg-[#EEF4FF] border border-[#2563eb]/20 text-[#2563eb] flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
            <span>Générateur de Lettre</span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>