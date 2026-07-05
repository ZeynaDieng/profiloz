<script setup lang="ts">
import { formatXof } from '@profiloz/shared'
import type { PlanDto } from '~/services/payment.service'

const props = withDefaults(
  defineProps<{
    plans: PlanDto[]
    loading?: boolean
    checkingOut?: string | null
    paywallHighlight?: boolean
    animateIn?: boolean
  }>(),
  {
    loading: false,
    checkingOut: null,
    paywallHighlight: false,
    animateIn: true,
  },
)

const emit = defineEmits<{
  choose: [plan: PlanDto]
}>()

const activeIndex = defineModel<number>('activeIndex', { default: 0 })

const scrollRef = ref<HTMLElement | null>(null)
const hasInitializedScroll = ref(false)
const swipeHintVisible = ref(true)

watch(
  () => props.plans.length,
  () => {
    nextTick(() => {
      resetToStartOnMobile()
      syncActivePlanFromScroll()
      playSwipeTease()
    })
  },
)

onMounted(() => {
  nextTick(() => {
    resetToStartOnMobile()
    syncActivePlanFromScroll()
    playSwipeTease()
  })
})

function dismissSwipeHint() {
  swipeHintVisible.value = false
}

function playSwipeTease() {
  if (!import.meta.client || !swipeHintVisible.value || props.plans.length <= 1) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  window.setTimeout(() => {
    const el = scrollRef.value
    if (!el || !isMobileRail() || el.scrollWidth <= el.clientWidth + 4) return

    const base = el.scrollLeft
    el.scrollTo({ left: base + 36, behavior: 'smooth' })
    window.setTimeout(() => {
      if (swipeHintVisible.value) {
        el.scrollTo({ left: base, behavior: 'smooth' })
      }
    }, 1100)
  }, 1200)
}

function isMobileRail() {
  return import.meta.client && window.matchMedia('(max-width: 767px)').matches
}

function resetToStartOnMobile() {
  if (!isMobileRail() || hasInitializedScroll.value || props.plans.length === 0) return
  scrollToPlan(0, 'auto', false)
  hasInitializedScroll.value = true
}

function syncActivePlanFromScroll() {
  const el = scrollRef.value
  if (!el || !isMobileRail() || el.children.length === 0) return

  const scrollCenter = el.scrollLeft + el.clientWidth / 2
  let closest = 0
  let minDist = Infinity

  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement
    const childCenter = child.offsetLeft + child.offsetWidth / 2
    const dist = Math.abs(scrollCenter - childCenter)
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  activeIndex.value = closest
}

function scrollToPlan(index: number, behavior: ScrollBehavior = 'smooth', dismissHint = true) {
  const el = scrollRef.value
  const card = el?.children[index] as HTMLElement | undefined
  if (!el || !card) return

  const targetLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
  el.scrollTo({ left: targetLeft, behavior })
  activeIndex.value = index
  if (dismissHint) dismissSwipeHint()
}

defineExpose({ scrollToPlan, resetToStartOnMobile })
</script>

<template>
  <div
    class="pricing-plans"
    :class="[
      paywallHighlight && 'pricing-plans--paywall',
      animateIn && !loading && plans.length > 0 && 'pricing-plans--ready',
    ]"
  >
    <div v-if="loading" class="pricing-rail pricing-rail--loading -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="22rem" class="rounded-2xl pricing-card-shell" />
    </div>

    <div v-else-if="plans.length > 0" class="pricing-rail-wrap md:contents" :class="swipeHintVisible && plans.length > 1 && 'pricing-rail-wrap--hint'">
      <div
        ref="scrollRef"
        class="pricing-rail -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0"
        role="list"
        aria-label="Offres tarifaires, glissez horizontalement pour comparer"
        @scroll.passive="syncActivePlanFromScroll"
        @pointerdown="dismissSwipeHint"
      >
        <article
          v-for="(plan, index) in plans"
          :key="plan.slug"
          role="listitem"
          class="pricing-card-shell"
          :aria-current="activeIndex === index ? 'true' : undefined"
        >
          <UiCard
            :variant="plan.popular ? 'glass' : 'default'"
            padding="lg"
            class="pricing-card relative flex flex-col h-full"
            :class="[
              plan.popular ? 'pricing-card--popular' : '',
              animateIn && 'pricing-card--revealed',
              activeIndex === index && 'pricing-card--active',
              paywallHighlight && plan.popular && 'pricing-card--spotlight',
            ]"
            :style="{ '--card-i': index }"
          >
            <span
              v-if="plan.popular"
              class="pricing-card__badge absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-bold whitespace-nowrap"
            >
              Le plus populaire
            </span>

            <h3 class="landing-subtitle md:text-lg md:font-bold">{{ plan.name }}</h3>
            <p class="text-sm text-on-surface-variant mt-1 min-h-[2.5rem]">{{ plan.description }}</p>

            <div class="mt-4 mb-5">
              <span class="text-3xl font-bold text-on-surface tabular-nums">{{ formatXof(plan.priceXof) }}</span>
              <span v-if="plan.kind === 'subscription'" class="text-on-surface-variant text-sm"> / mois</span>
            </div>

            <ul class="space-y-2.5 sm:space-y-3 mb-6 flex-1">
              <li
                v-for="(feature, featureIndex) in plan.features"
                :key="feature"
                class="pricing-feature flex items-start gap-2 text-sm text-on-surface"
                :style="{ '--feature-i': featureIndex }"
              >
                <UiPzIcon name="check_circle" class="text-[18px] text-secondary shrink-0 mt-0.5" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <UiButton
              block
              :variant="plan.popular ? 'secondary' : 'primary'"
              :loading="checkingOut === plan.slug"
              :aria-label="`Choisir l'offre ${plan.name}`"
              @click="emit('choose', plan)"
            >
              Choisir
            </UiButton>
          </UiCard>
        </article>
      </div>

      <div
        v-if="swipeHintVisible && plans.length > 1"
        class="pricing-swipe-cue md:hidden"
        aria-hidden="true"
      >
        <div class="pricing-swipe-cue__fade" />
        <div class="pricing-swipe-cue__chevrons">
          <UiPzIcon name="chevron_right" class="pricing-swipe-cue__icon pricing-swipe-cue__icon--a" />
          <UiPzIcon name="chevron_right" class="pricing-swipe-cue__icon pricing-swipe-cue__icon--b" />
        </div>
      </div>
    </div>

    <div
      v-if="!loading && plans.length > 1"
      class="pricing-dots md:hidden"
      role="tablist"
      aria-label="Parcourir les offres"
    >
      <button
        v-for="(plan, index) in plans"
        :key="plan.slug"
        type="button"
        role="tab"
        class="pricing-dot"
        :class="{ 'is-active': activeIndex === index }"
        :aria-label="`Offre ${plan.name}`"
        :aria-selected="activeIndex === index"
        @click="scrollToPlan(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.pricing-rail-wrap {
  position: relative;
  padding-bottom: 1rem;
}

.pricing-rail-wrap--hint .pricing-card {
  animation: pricing-card-sway 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
  animation-delay: calc(var(--card-i, 0) * 120ms);
}

.pricing-rail-wrap--hint .pricing-card--active {
  transform: none;
  box-shadow: var(--shadow-elevated-sm);
}

.pricing-rail-wrap--hint .pricing-card--popular.pricing-card--active {
  box-shadow:
    var(--shadow-elevated-md),
    0 0 0 1px color-mix(in srgb, var(--color-secondary) 20%, transparent);
}

.pricing-swipe-cue {
  position: absolute;
  inset: 0 0 0.75rem;
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.35s ease;
}

.pricing-swipe-cue__fade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4.5rem;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-background) 20%, transparent) 35%,
    color-mix(in srgb, var(--color-background) 88%, transparent) 100%
  );
}

.pricing-swipe-cue__chevrons {
  position: absolute;
  top: 42%;
  right: 0.85rem;
  display: flex;
  align-items: center;
  color: var(--color-secondary);
  filter: drop-shadow(0 2px 6px rgba(11, 28, 48, 0.12));
  animation: pricing-swipe-cue-gentle 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

@keyframes pricing-swipe-cue-gentle {
  from {
    transform: translateX(0);
    opacity: 0.72;
  }
  to {
    transform: translateX(5px);
    opacity: 1;
  }
}

@keyframes pricing-card-sway {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(2px, 0, 0);
  }
}

.pricing-swipe-cue__icon {
  font-size: 1.35rem;
  line-height: 1;
}

.pricing-swipe-cue__icon--a {
  opacity: 0.45;
  margin-right: -0.55rem;
}

.pricing-swipe-cue__icon--b {
  opacity: 1;
}

.pricing-rail {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: max(1rem, env(safe-area-inset-left));
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-top: 0.25rem;
  padding-bottom: 1.75rem;
}

.pricing-rail::-webkit-scrollbar {
  display: none;
}

.pricing-rail--loading {
  scroll-snap-type: none;
}

.pricing-card-shell {
  flex: 0 0 min(88vw, 20rem);
  scroll-snap-align: center;
  scroll-snap-stop: always;
  padding-bottom: 0.5rem;
}

.pricing-card {
  border-width: 1px;
  box-shadow: var(--shadow-elevated-sm);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.4s ease,
    border-color 0.35s ease;
}

.pricing-card--popular {
  border-color: var(--color-secondary);
  box-shadow:
    var(--shadow-elevated-md),
    0 0 0 1px color-mix(in srgb, var(--color-secondary) 20%, transparent);
}

.pricing-card--active {
  transform: translateY(-2px) scale(1.015);
  box-shadow: var(--shadow-elevated-md);
}

.pricing-card--popular.pricing-card--active {
  box-shadow: var(--shadow-elevated-lg);
}

.pricing-card__badge {
  animation: pricing-badge-glow 2.8s ease-in-out infinite;
}

.pricing-plans--paywall .pricing-card--spotlight {
  animation:
    pricing-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards,
    pricing-paywall-spotlight 2.2s ease-in-out 0.35s 2;
}

@keyframes pricing-paywall-spotlight {
  0%, 100% {
    transform: translateY(-2px) scale(1.015);
    box-shadow:
      var(--shadow-elevated-lg),
      0 0 0 0 color-mix(in srgb, var(--color-secondary) 0%, transparent);
  }
  50% {
    transform: translateY(-4px) scale(1.03);
    box-shadow:
      var(--shadow-elevated-lg),
      0 0 0 8px color-mix(in srgb, var(--color-secondary) 16%, transparent);
  }
}

@keyframes pricing-badge-glow {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-secondary) 0%, transparent); }
  50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-secondary) 14%, transparent); }
}

.pricing-plans--ready .pricing-card--revealed {
  animation: pricing-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--card-i, 0) * 90ms + 80ms);
}

.pricing-rail-wrap--hint .pricing-card--revealed {
  animation: pricing-card-sway 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
  animation-delay: calc(var(--card-i, 0) * 120ms);
}

.pricing-plans--ready .pricing-card--revealed .pricing-feature {
  animation: pricing-feature-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--card-i, 0) * 90ms + 140ms + var(--feature-i, 0) * 35ms);
}

@keyframes pricing-rise {
  from {
    transform: translateY(20px);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pricing-feature-in {
  from {
    transform: translateX(-8px);
    opacity: 0.65;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.pricing-plans {
  padding-bottom: 0.75rem;
}

.pricing-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding-bottom: 0.25rem;
}

.pricing-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-outline-variant) 70%, transparent);
  transition:
    width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.3s ease;
}

.pricing-dot.is-active {
  width: 1.25rem;
  background: var(--color-secondary);
}

@media (min-width: 768px) {
  .pricing-rail-wrap {
    padding-bottom: 0;
  }

  .pricing-rail-wrap--hint .pricing-card,
  .pricing-rail-wrap--hint .pricing-card--revealed {
    animation: none;
  }

  .pricing-rail-wrap--hint .pricing-card--active {
    animation: none;
  }

  .pricing-rail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    overflow: visible;
    scroll-snap-type: none;
    padding-top: 0;
    padding-bottom: 0.5rem;
  }

  .pricing-card-shell {
    flex: initial;
    scroll-snap-align: unset;
    padding-bottom: 0;
  }

  .pricing-card--active,
  .pricing-plans--paywall .pricing-card--spotlight {
    transform: none;
    animation: none;
  }
}

@media (min-width: 1280px) {
  .pricing-rail {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (hover: hover) {
  .pricing-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-elevated-md);
  }

  .pricing-card--popular:hover {
    box-shadow: var(--shadow-elevated-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pricing-swipe-cue__chevrons,
  .pricing-rail-wrap--hint .pricing-card,
  .pricing-rail-wrap--hint .pricing-card--revealed,
  .pricing-card__badge,
  .pricing-plans--ready .pricing-card--revealed,
  .pricing-plans--ready .pricing-card--revealed .pricing-feature,
  .pricing-plans--paywall .pricing-card--spotlight {
    animation: none;
  }

  .pricing-card {
    transition: none;
  }

  .pricing-dot {
    transition: none;
  }
}
</style>
