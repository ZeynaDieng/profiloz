<script setup lang="ts">
const testimonials = [
  {
    title: 'Un CV prêt en quelques minutes',
    quote: 'Mon CV était prêt en moins de 10 minutes. Le PDF est impeccable et prêt à envoyer.',
    name: 'Aminata D.',
    ago: 'Il y a 2 jours',
  },
  {
    title: 'Import fluide et rapide',
    quote: 'J\'ai importé mon ancien CV et tout s\'est rempli automatiquement. J\'ai juste corrigé deux détails.',
    name: 'Moussa S.',
    ago: 'Il y a 5 jours',
  },
  {
    title: 'Enfin pensé pour le mobile',
    quote: 'Simple, élégant, et enfin un outil où je peux créer mon dossier depuis mon téléphone.',
    name: 'Fatou N.',
    ago: 'Il y a 1 semaine',
  },
  {
    title: 'CV et lettre au même endroit',
    quote: 'J\'ai créé mon CV et ma lettre sur la même plateforme. Tout est harmonisé, c\'est top.',
    name: 'Ibrahima K.',
    ago: 'Il y a 1 semaine',
  },
  {
    title: 'Modèles vraiment pros',
    quote: 'Les modèles sont modernes et lisibles. Mon recruteur m\'a dit que mon dossier était très clair.',
    name: 'Mariame T.',
    ago: 'Il y a 2 semaines',
  },
  {
    title: 'Service au top',
    quote: 'Réponse rapide et parcours guidé du début à la fin. Je recommande sans hésiter.',
    name: 'Omar B.',
    ago: 'Il y a 3 semaines',
  },
] as const

const railRef = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const canScroll = ref(false)

const { target, revealed } = useScrollReveal(0.15)

function updateScrollState() {
  const el = railRef.value
  if (!el) return

  const max = Math.max(el.scrollWidth - el.clientWidth, 0)
  canScroll.value = max > 8
  scrollProgress.value = max > 0 ? (el.scrollLeft / max) * 100 : 100
}

function scrollBy(direction: 'prev' | 'next') {
  const el = railRef.value
  if (!el) return

  const card = el.querySelector<HTMLElement>('.review-card')
  const gap = 16
  const delta = (card?.offsetWidth ?? 280) + gap

  el.scrollBy({
    left: direction === 'next' ? delta : -delta,
    behavior: 'smooth',
  })
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', updateScrollState, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollState)
})
</script>

<template>
  <section
    ref="target"
    class="testimonials-strip scroll-reveal overflow-x-clip max-w-full"
    :class="revealed && 'is-revealed'"
  >
    <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop">
      <h2 class="testimonials-strip__headline landing-title text-center text-balance">
        94&nbsp;% des candidats nous recommandent
      </h2>

      <div class="testimonials-strip__layout">
        <aside class="testimonials-strip__score">
          <p class="testimonials-strip__rating-value">4,8 sur 5</p>

          <div class="testimonials-strip__stars" aria-label="Note moyenne 4,8 sur 5">
            <UiPzIcon
              v-for="i in 5"
              :key="i"
              name="star"
              filled
              class="testimonials-strip__star"
            />
          </div>

          <div class="testimonials-strip__brand">
            <UiPzIcon name="star" filled class="testimonials-strip__brand-icon" />
            <span class="testimonials-strip__brand-name">Profilo'Z</span>
          </div>

          <p class="testimonials-strip__meta">Plus de 12&nbsp;000 CV créés</p>
        </aside>

        <div class="testimonials-strip__carousel">
          <div
            ref="railRef"
            class="testimonials-strip__rail"
            @scroll.passive="updateScrollState"
          >
            <figure
              v-for="item in testimonials"
              :key="item.name + item.title"
              class="review-card"
            >
              <div class="review-card__stars" aria-hidden="true">
                <UiPzIcon
                  v-for="i in 5"
                  :key="i"
                  name="star"
                  filled
                  class="review-card__star"
                />
              </div>

              <p class="review-card__title">{{ item.title }}</p>
              <blockquote class="review-card__quote">
                {{ item.quote }}
              </blockquote>
              <figcaption class="review-card__meta">
                {{ item.name }} · {{ item.ago }}
              </figcaption>
            </figure>
          </div>

          <div class="testimonials-strip__controls">
            <div class="testimonials-strip__nav">
              <button
                type="button"
                class="testimonials-strip__nav-btn"
                aria-label="Avis précédent"
                :disabled="!canScroll || scrollProgress <= 0"
                @click="scrollBy('prev')"
              >
                <UiPzIcon name="chevron_left" class="text-[22px]" />
              </button>
              <button
                type="button"
                class="testimonials-strip__nav-btn"
                aria-label="Avis suivant"
                :disabled="!canScroll || scrollProgress >= 99.5"
                @click="scrollBy('next')"
              >
                <UiPzIcon name="chevron_right" class="text-[22px]" />
              </button>
            </div>

            <div
              class="testimonials-strip__progress"
              role="progressbar"
              :aria-valuenow="Math.round(scrollProgress)"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Progression du carrousel"
            >
              <span
                class="testimonials-strip__progress-fill"
                :style="{ width: `${scrollProgress}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials-strip {
  padding: 2.75rem 0 3rem;
  border-block: 1px solid color-mix(in srgb, var(--color-outline-variant) 20%, transparent);
  background: color-mix(in srgb, var(--color-surface-container-low) 45%, var(--color-background));
}

@media (min-width: 768px) {
  .testimonials-strip {
    padding: 3.5rem 0 4rem;
  }
}

.testimonials-strip__headline {
  max-width: 16ch;
  margin-inline: auto;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .testimonials-strip__headline {
    margin-bottom: 2.75rem;
    max-width: none;
  }
}

.testimonials-strip__layout {
  display: grid;
  gap: 1.75rem;
}

@media (min-width: 1024px) {
  .testimonials-strip__layout {
    grid-template-columns: minmax(9.5rem, 12rem) minmax(0, 1fr);
    gap: 2.5rem;
    align-items: start;
  }
}

.testimonials-strip__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (min-width: 1024px) {
  .testimonials-strip__score {
    align-items: flex-start;
    text-align: left;
    padding-top: 0.25rem;
  }
}

.testimonials-strip__rating-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-on-surface);
  line-height: 1.1;
}

.testimonials-strip__stars {
  display: flex;
  gap: 0.125rem;
  margin-top: 0.5rem;
}

.testimonials-strip__star {
  font-size: 1.125rem;
  color: var(--color-accent-green);
}

.testimonials-strip__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.875rem;
}

.testimonials-strip__brand-icon {
  font-size: 1rem;
  color: var(--color-accent-green);
}

.testimonials-strip__brand-name {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--color-on-surface);
  letter-spacing: -0.02em;
}

.testimonials-strip__meta {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-on-surface-variant);
}

.testimonials-strip__carousel {
  min-width: 0;
}

.testimonials-strip__rail {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: 0.25rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.testimonials-strip__rail::-webkit-scrollbar {
  display: none;
}

.review-card {
  flex: 0 0 min(82vw, 18.5rem);
  scroll-snap-align: start;
  margin: 0;
  padding: 1.125rem 1.125rem 1rem;
  border-radius: 0.25rem;
  background: transparent;
}

@media (min-width: 640px) {
  .review-card {
    flex-basis: 17.5rem;
  }
}

.review-card__stars {
  display: flex;
  gap: 0.1rem;
}

.review-card__star {
  font-size: 0.9375rem;
  color: var(--color-accent-green);
}

.review-card__title {
  margin-top: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--color-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-card__quote {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-card__meta {
  margin-top: 0.875rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-on-surface-variant) 88%, transparent);
}

.testimonials-strip__controls {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-top: 1.25rem;
}

.testimonials-strip__nav {
  display: flex;
  gap: 0.5rem;
}

.testimonials-strip__nav-btn {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--color-outline-variant) 45%, transparent);
  background: color-mix(in srgb, var(--color-secondary-fixed) 35%, white);
  color: var(--color-on-surface-variant);
  transition:
    background-color var(--pz-duration-normal, 250ms) ease,
    border-color var(--pz-duration-normal, 250ms) ease,
    transform var(--pz-duration-normal, 250ms) ease;
}

.testimonials-strip__nav-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-secondary-fixed) 55%, white);
  border-color: color-mix(in srgb, var(--color-secondary) 20%, transparent);
}

.testimonials-strip__nav-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.testimonials-strip__nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.testimonials-strip__progress {
  position: relative;
  height: 3px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-outline-variant) 35%, transparent);
  overflow: hidden;
}

.testimonials-strip__progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--color-accent-teal),
    var(--color-accent-green)
  );
  transition: width 180ms var(--pz-ease-out, ease);
}

@media (prefers-reduced-motion: reduce) {
  .testimonials-strip__progress-fill {
    transition: none;
  }

  .testimonials-strip__rail {
    scroll-behavior: auto;
  }
}
</style>
