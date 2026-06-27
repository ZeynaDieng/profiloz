<script setup lang="ts">
import type { Experience } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'

const props = defineProps<{
  exp: Experience
  accent?: string
  companyClass?: string
  locationClass?: string
  periodClass?: string
  descriptionClass?: string
  layout?: 'stacked' | 'inline-header'
}>()

const period = computed(() => formatDateRange(props.exp.startDate, props.exp.endDate, props.exp.isCurrent))
const locationLine = computed(() =>
  [props.exp.location, props.exp.country].filter((part) => part?.trim()).join(', '),
)
</script>

<template>
  <div class="experience-entry">
    <template v-if="layout === 'inline-header'">
      <div class="flex justify-between text-sm font-bold gap-4">
        <span>{{ exp.position }}<span v-if="exp.company"> — {{ exp.company }}</span></span>
        <span v-if="period" :class="periodClass ?? 'text-on-surface-variant font-normal shrink-0'">{{ period }}</span>
      </div>
      <p v-if="locationLine" :class="locationClass ?? 'text-xs text-on-surface-variant mt-0.5'">{{ locationLine }}</p>
    </template>
    <template v-else>
      <p v-if="exp.position" class="font-bold text-sm">{{ exp.position }}</p>
      <p
        v-if="exp.company"
        :class="companyClass ?? 'text-xs text-on-surface-variant'"
        :style="accent && !companyClass ? { color: accent } : undefined"
      >
        {{ exp.company }}
      </p>
      <p v-if="locationLine" :class="locationClass ?? 'text-xs text-on-surface-variant'">{{ locationLine }}</p>
      <p v-if="period" :class="periodClass ?? 'text-xs text-on-surface-variant'">{{ period }}</p>
    </template>
    <p
      v-if="exp.description?.trim()"
      :class="descriptionClass ?? 'text-sm text-on-surface-variant mt-1 whitespace-pre-line'"
    >
      {{ exp.description }}
    </p>
    <div v-if="exp.skillsUsed?.length" class="flex flex-wrap gap-1 mt-1">
      <span
        v-for="(skill, i) in exp.skillsUsed"
        :key="i"
        class="text-[10px] px-1.5 py-0.5 rounded bg-on-surface/5 text-on-surface-variant"
        :style="accent ? { color: accent } : undefined"
      >
        {{ skill }}
      </span>
    </div>
  </div>
</template>
