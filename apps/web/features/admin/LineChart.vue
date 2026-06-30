<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    series: Array<{ date: string; value: number }>
    valueSuffix?: string
    height?: number
  }>(),
  { valueSuffix: '', height: 160 },
)

const { formatNumber } = useAdminFormat()

const max = computed(() => Math.max(1, ...props.series.map((p) => p.value)))
const points = computed(() => {
  if (props.series.length <= 1) return ''
  const w = 100
  const h = 100
  return props.series
    .map((p, i) => {
      const x = (i / (props.series.length - 1)) * w
      const y = h - (p.value / max.value) * (h - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
})

const latest = computed(() => props.series.at(-1)?.value ?? 0)
</script>

<template>
  <UiCard padding="lg" class="h-full">
    <div class="flex items-center justify-between gap-3 mb-4">
      <h3 class="font-semibold text-on-surface">{{ title }}</h3>
      <span class="text-sm text-on-surface-variant">{{ formatNumber(latest) }}{{ valueSuffix }}</span>
    </div>
    <div class="relative" :style="{ height: `${height}px` }">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full overflow-visible">
        <defs>
          <linearGradient :id="`grad-${title}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.25" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon
          v-if="points"
          :points="`${points} 100,100 0,100`"
          class="text-secondary"
          :fill="`url(#grad-${title})`"
        />
        <polyline
          v-if="points"
          fill="none"
          class="text-secondary stroke-current"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          :points="points"
        />
      </svg>
    </div>
    <div class="flex justify-between text-[10px] text-on-surface-variant mt-2">
      <span>{{ series[0]?.date.slice(5) }}</span>
      <span>{{ series.at(-1)?.date.slice(5) }}</span>
    </div>
  </UiCard>
</template>
