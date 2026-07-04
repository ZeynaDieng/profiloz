<script setup lang="ts">
const config = useRuntimeConfig()
const { content, load, section } = useLandingContent()

onMounted(() => load())

const heroVariant = computed(() =>
  (config.public.heroVariant as string) === 'start' ? 'start' : 'transform',
)

const hero = computed(() => section<{
  titleTransform?: string
  titleStart?: string
  subtitle?: string
  ctaPrimary?: string
  ctaPrimaryLink?: string
  ctaSecondary?: string
  ctaSecondaryLink?: string
  journeySteps?: string[]
}>('hero'))

const heroBannerSrc = computed(
  () => (config.public.heroBannerUrl as string)?.trim() || '/landing/hero-banner.png',
)

const heroBannerMobileSrc = computed(() => {
  const mobile = (config.public.heroBannerMobileUrl as string)?.trim()
  if (mobile) return mobile
  return heroBannerSrc.value
})

const heroBannerStyle = computed(() => ({
  '--hero-banner-image': `url('${heroBannerSrc.value}')`,
  '--hero-banner-image-mobile': `url('${heroBannerMobileSrc.value}')`,
}))

const heroLines = computed(() => {
  if (heroVariant.value === 'transform') {
    const custom = hero.value.titleTransform?.trim()
    if (custom) {
      const dot = custom.indexOf('.')
      if (dot > 0 && dot < custom.length - 2) {
        return [custom.slice(0, dot + 1).trim(), custom.slice(dot + 1).trim()]
      }
      return [custom, '']
    }
    return ['Créez un CV et une lettre', 'en quelques minutes.']
  }

  const custom = hero.value.titleStart?.trim()
  if (custom) {
    const dot = custom.indexOf('.')
    if (dot > 0 && dot < custom.length - 2) {
      return [custom.slice(0, dot + 1).trim(), custom.slice(dot + 1).trim()]
    }
    return [custom, '']
  }
  return ['Tout ce qu\'il faut', 'pour réussir votre candidature.']
})

const heroPills = ['PDF en quelques minutes', 'Compatible ATS', 'CV + lettre réunis'] as const

const heroLine2 = computed(() => heroLines.value[1] ?? '')

const heroCopyVisible = ref(false)

watch(
  heroLine2,
  (line) => {
    if (!line) heroCopyVisible.value = true
  },
  { immediate: true },
)

function onHeroTitleComplete() {
  heroCopyVisible.value = true
}
</script>

<template>
  <section class="hero-banner" :style="heroBannerStyle">
    <div class="hero-banner__bg" aria-hidden="true" />
    <div class="hero-banner__scrim" aria-hidden="true" />

    <div
      class="hero-banner__inner max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center"
    >
      <div class="hero-banner__copy flex flex-col text-center lg:text-left lg:max-w-[31rem] mx-auto lg:mx-0 min-w-0 max-w-full">
        <h1 class="hero-banner__title landing-display">
          <span class="hero-banner__title-line text-on-surface">{{ heroLines[0] }}</span>
          <span v-if="heroLine2" class="hero-banner__title-line hero-banner__title-line--typewriter text-secondary">
            <UiTypewriterText
              tag="span"
              :segments="[{ text: heroLine2 }]"
              loop
              loop-mode="full"
              @complete="onHeroTitleComplete"
            />
          </span>
        </h1>

        <p
          class="hero-copy-reveal landing-lead mx-auto lg:mx-0 mt-3 md:mt-4 text-balance order-2"
          :class="heroCopyVisible && 'is-visible'"
        >
          {{
            hero.subtitle
              || "Profilo'Z réunit modèles professionnels, éditeur guidé et export PDF. Votre dossier complet, au même endroit."
          }}
        </p>

        <div
          class="hero-copy-reveal hero-banner__actions order-3 lg:order-4 mt-6 lg:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3"
          :class="heroCopyVisible && 'is-visible'"
          style="transition-delay: 80ms"
        >
          <NuxtLink
            :to="hero.ctaPrimaryLink || '/creer'"
            class="btn-primary hero-banner__btn w-full sm:w-auto px-7 py-3 rounded-2xl premium-shadow-sm"
          >
            {{ hero.ctaPrimary || 'Commencer gratuitement' }}
          </NuxtLink>
          <NuxtLink
            :to="hero.ctaSecondaryLink || '/creer/lettre'"
            class="btn-outline hero-banner__btn w-full sm:w-auto px-7 py-3 rounded-2xl bg-white/90"
          >
            {{ hero.ctaSecondary || 'Créer une lettre' }}
          </NuxtLink>
        </div>

        <div
          class="hero-copy-reveal hero-banner__badges order-4 lg:order-3 mt-5 md:mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-2"
          :class="heroCopyVisible && 'is-visible'"
        >
          <span
            v-for="pill in heroPills"
            :key="pill"
            class="landing-pill hero-banner__pill"
          >
            <span class="landing-pill__dot" aria-hidden="true" />
            {{ pill }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-banner {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: clamp(22rem, 66.6vw, 42.625rem);
  padding: clamp(2.5rem, 5vw, 3.75rem) 0;
}

.hero-banner__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: #ffffff;
  background-image: var(--hero-banner-image);
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: top center;
}

.hero-banner__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.18) 28%,
    transparent 52%
  );
}

@media (max-width: 1023px) {
  .hero-banner {
    min-height: auto;
    padding: 2.5rem 0;
  }

  .hero-banner__bg {
    inset: 0;
    background-image: var(--hero-banner-image-mobile, var(--hero-banner-image));
    background-size: cover;
    background-position: center 35%;
  }

  /* Voile blanc léger : couleurs desktop + image plus visible */
  .hero-banner__scrim {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.82) 0%,
      rgba(255, 255, 255, 0.62) 28%,
      rgba(255, 255, 255, 0.28) 48%,
      rgba(255, 255, 255, 0.06) 68%,
      transparent 88%
    );
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .hero-banner__inner {
    padding: 0;
  }

  .hero-banner__title.landing-display {
    font-size: 1.375rem;
  }
}

@media (min-width: 1024px) {
  .hero-banner__scrim {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.28) 0%,
      rgba(255, 255, 255, 0.08) 18%,
      transparent 38%
    );
  }
}

.hero-banner__inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-banner__title {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-wrap: balance;
}

.hero-banner__title-line {
  display: block;
  line-height: 1.14;
  overflow-wrap: anywhere;
}

.hero-banner__title-line--typewriter {
  min-height: 1.2em;
  margin-top: 0.125rem;
}

.hero-banner__pill {
  font-size: 0.6875rem;
  padding: 0.375rem 0.75rem;
}

@media (min-width: 640px) {
  .hero-banner__pill {
    font-size: 0.75rem;
  }
}

.hero-banner__btn {
  font-size: 0.875rem;
}

.hero-banner__steps {
  font-size: 0.6875rem;
}

@media (min-width: 640px) {
  .hero-banner__steps {
    font-size: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-enter {
    opacity: 1;
    animation: none;
  }
}
</style>
