<script setup lang="ts">
import type { TemplateViewerItem } from '~/features/templates/viewer'

/**
 * Aperçu plein écran d'un modèle (CV ou lettre), ouvert depuis l'œil d'une carte.
 * Mobile : pincer / double tap pour zoomer, glisser pour changer. Ordinateur : − +, flèches, clavier.
 * Rien n'est choisi tant que « Utiliser ce modèle » n'est pas cliqué.
 */
const props = defineProps<{ items: TemplateViewerItem[] }>()
const index = defineModel<number | null>({ required: true })
const emit = defineEmits<{ use: [key: string] }>()

defineSlots<{ page(props: { item: TemplateViewerItem }): unknown }>()

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEPS = [1, 1.5, 2, 3]
const MAX_DOTS = 7

const zoom = ref(1)
const showHint = ref(false)
const bodyRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
const bodySize = ref({ width: 0, height: 0 })
let previousFocus: HTMLElement | null = null
let hintTimer: ReturnType<typeof setTimeout> | undefined

const isOpen = computed(() => index.value !== null && props.items.length > 0)
const current = computed(() => (index.value !== null ? props.items[index.value] ?? null : null))
const hasMany = computed(() => props.items.length > 1)

/** Largeur de la page à 100 % : toute la largeur sur mobile, toute la hauteur sur grand écran. */
const baseWidth = computed(() => {
  const { width, height } = bodySize.value
  if (!width || !height) return 0
  const isWide = width >= 640
  return isWide ? Math.min(width - 48, (height - 32) * (210 / 297)) : width - 32
})
const pageWidth = computed(() => Math.round(baseWidth.value * zoom.value))

const dots = computed(() => {
  const total = props.items.length
  const at = index.value ?? 0
  const start = Math.max(0, Math.min(at - Math.floor(MAX_DOTS / 2), total - MAX_DOTS))
  return Array.from({ length: Math.min(total, MAX_DOTS) }, (_, i) => start + i).map((i) => ({ i, active: i === at }))
})

function close() {
  index.value = null
}

function go(step: number) {
  if (index.value === null || !hasMany.value) return
  index.value = (index.value + step + props.items.length) % props.items.length
}

function setZoom(value: number, origin?: { x: number; y: number }) {
  const el = bodyRef.value
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
  if (!el || next === zoom.value) {
    zoom.value = next
    return
  }
  // Garder le point visé (doigts / centre) au même endroit après le zoom
  const ratio = next / zoom.value
  const ox = origin?.x ?? el.clientWidth / 2
  const oy = origin?.y ?? el.clientHeight / 2
  const targetLeft = (el.scrollLeft + ox) * ratio - ox
  const targetTop = (el.scrollTop + oy) * ratio - oy
  zoom.value = next
  nextTick(() => el.scrollTo({ left: targetLeft, top: targetTop }))
}

function stepZoom(direction: 1 | -1) {
  const steps = direction > 0 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse()
  const next = steps.find((s) => (direction > 0 ? s > zoom.value + 0.01 : s < zoom.value - 0.01))
  if (next) setZoom(next)
}

function useCurrent() {
  if (!current.value) return
  emit('use', current.value.key)
  close()
}

// ─── Gestes tactiles : pincer, double tap, glisser ─────────────────────
let pinchStart: { distance: number; zoom: number } | null = null
let swipeStart: { x: number; y: number; time: number } | null = null
let lastTap = 0

function touchDistance(touches: TouchList) {
  const [a, b] = [touches[0]!, touches[1]!]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function relativePoint(clientX: number, clientY: number) {
  const rect = bodyRef.value!.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    pinchStart = { distance: touchDistance(e.touches), zoom: zoom.value }
    swipeStart = null
    return
  }
  const t = e.touches[0]!
  swipeStart = { x: t.clientX, y: t.clientY, time: Date.now() }
}

function onTouchMove(e: TouchEvent) {
  if (pinchStart && e.touches.length === 2) {
    e.preventDefault()
    const [a, b] = [e.touches[0]!, e.touches[1]!]
    const center = relativePoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
    setZoom(pinchStart.zoom * (touchDistance(e.touches) / pinchStart.distance), center)
  }
}

function onTouchEnd(e: TouchEvent) {
  if (pinchStart) {
    if (e.touches.length < 2) pinchStart = null
    return
  }
  const start = swipeStart
  swipeStart = null
  const t = e.changedTouches[0]
  if (!start || !t) return
  const dx = t.clientX - start.x
  const dy = t.clientY - start.y
  const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - start.time < 300

  if (isTap) {
    const now = Date.now()
    if (now - lastTap < 300) {
      setZoom(zoom.value > 1 ? 1 : 2, relativePoint(t.clientX, t.clientY))
      lastTap = 0
    } else {
      lastTap = now
    }
    return
  }
  // Glisser pour changer de modèle, seulement sans zoom (sinon le doigt déplace la page)
  if (zoom.value === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === '+' || e.key === '=') stepZoom(1)
  else if (e.key === '-') stepZoom(-1)
  else return
  e.preventDefault()
}

function measure() {
  const el = bodyRef.value
  if (el) bodySize.value = { width: el.clientWidth, height: el.clientHeight }
}

watch(isOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', measure)
    nextTick(() => {
      measure()
      closeRef.value?.focus()
    })
    // Indication des gestes : seulement sur écran tactile, 2,5 s
    showHint.value = window.matchMedia('(pointer: coarse)').matches
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => { showHint.value = false }, 2500)
  } else {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', measure)
    previousFocus?.focus?.()
  }
})

// Nouveau modèle : repartir à 100 %, en haut de la page
watch(index, () => {
  zoom.value = 1
  nextTick(() => bodyRef.value?.scrollTo({ left: 0, top: 0 }))
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measure)
  clearTimeout(hintTimer)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && current"
      class="fixed inset-0 z-[100] flex flex-col bg-[#0e1726] text-white"
      role="dialog"
      aria-modal="true"
      :aria-label="`Aperçu du modèle ${current.name}`"
    >
      <header class="shrink-0 h-[60px] sm:h-[72px] px-2 sm:px-8 grid grid-cols-[44px_minmax(0,1fr)_44px] sm:flex sm:items-center sm:justify-between items-center">
        <button
          ref="closeRef"
          type="button"
          aria-label="Fermer l'aperçu"
          class="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 sm:order-2 sm:bg-white/10 sm:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          @click="close"
        >
          <svg class="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div class="text-center sm:text-left min-w-0 sm:order-1">
          <p class="font-headline-md font-semibold text-base sm:text-xl truncate">{{ current.name }}</p>
          <p class="text-[11px] sm:text-[13px] text-[#a9b4c8]">
            {{ (index ?? 0) + 1 }} / {{ items.length }}<template v-if="current.category"> · {{ current.category }}</template>
          </p>
        </div>
        <span class="sm:hidden" />
      </header>

      <div class="relative flex-1 min-h-0">
        <div
          ref="bodyRef"
          class="absolute inset-0 overflow-auto overscroll-contain"
          :style="{ touchAction: zoom > 1 ? 'pan-x pan-y' : 'pan-y' }"
          @touchstart.passive="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="min-w-full min-h-full w-max flex justify-center items-start p-4 sm:p-4">
            <div class="shadow-[0_8px_28px_rgba(0,0,0,0.45)] rounded-[4px] overflow-hidden" :class="zoom === 1 ? 'cursor-zoom-in' : ''">
              <UiA4Sheet v-if="pageWidth > 0" :width="pageWidth">
                <slot name="page" :item="current" />
              </UiA4Sheet>
            </div>
          </div>
        </div>

        <template v-if="hasMany">
          <button
            type="button"
            aria-label="Modèle précédent"
            class="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/[0.14] hover:bg-white/25 items-center justify-center"
            @click="go(-1)"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button
            type="button"
            aria-label="Modèle suivant"
            class="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/[0.14] hover:bg-white/25 items-center justify-center"
            @click="go(1)"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </template>

        <Transition name="fade">
          <p
            v-if="showHint"
            class="pointer-events-none absolute left-1/2 bottom-3.5 -translate-x-1/2 whitespace-nowrap text-xs text-[#dbe1ff] bg-white/10 rounded-full px-3 py-[7px]"
          >
            Pincez pour zoomer · glissez pour changer
          </p>
        </Transition>
      </div>

      <footer class="shrink-0 px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2.5 sm:gap-4">
        <!-- Mobile : flèches sous le CV, autour des points, pour ne rien poser sur la page -->
        <div v-if="hasMany" class="flex items-center justify-center gap-3 sm:hidden">
          <button type="button" aria-label="Modèle précédent" class="w-10 h-10 rounded-full bg-white/[0.14] flex items-center justify-center" @click="go(-1)">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div class="flex items-center gap-1.5" aria-hidden="true">
            <span
              v-for="dot in dots"
              :key="dot.i"
              class="h-1.5 rounded-full transition-all"
              :class="dot.active ? 'w-[18px] bg-white' : 'w-1.5 bg-white/35'"
            />
          </div>
          <button type="button" aria-label="Modèle suivant" class="w-10 h-10 rounded-full bg-white/[0.14] flex items-center justify-center" @click="go(1)">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <div class="hidden sm:flex items-center gap-1 rounded-full bg-white/10 p-1">
          <button type="button" aria-label="Dézoomer" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-40" :disabled="zoom <= MIN_ZOOM" @click="stepZoom(-1)">
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12" /></svg>
          </button>
          <span class="min-w-[52px] text-center text-sm font-semibold">{{ Math.round(zoom * 100) }} %</span>
          <button type="button" aria-label="Zoomer" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-40" :disabled="zoom >= MAX_ZOOM" @click="stepZoom(1)">
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
          </button>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto rounded-xl bg-secondary px-4 sm:px-[26px] py-[15px] sm:py-[13px] text-base font-bold text-white hover:bg-secondary/90"
          @click="useCurrent"
        >
          Utiliser ce modèle
        </button>
      </footer>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-leave-active { transition: opacity 0.4s ease; }
.fade-leave-to { opacity: 0; }
</style>
