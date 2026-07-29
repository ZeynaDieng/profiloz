<script setup lang="ts">
import type { Education } from '@profiloz/shared'
import { formatEducationPeriod } from '~/utils/education'

const props = defineProps<{
  edu: Education
  accent?: string
  institutionClass?: string
  fieldClass?: string
  periodClass?: string
  layout?: 'stacked' | 'inline-header'
}>()

const period = computed(() => formatEducationPeriod(props.edu.startDate, props.edu.endDate))
</script>

<template>
  <div class="education-entry">
    <template v-if="layout === 'inline-header'">
      <div class="flex justify-between text-sm font-bold gap-4">
        <span>{{ edu.degree }}<span v-if="edu.institution" class="font-semibold text-on-surface-variant"> — {{ edu.institution }}</span></span>
        <span v-if="period" :class="periodClass ?? 'text-on-surface-variant font-normal shrink-0 text-xs'">{{ period }}</span>
      </div>
      <p v-if="edu.field" :class="fieldClass ?? 'text-xs text-on-surface-variant mt-0.5'">{{ edu.field }}</p>
    </template>
    <template v-else>
      <p v-if="edu.degree" class="font-bold text-sm">{{ edu.degree }}</p>
      <p
        v-if="edu.institution"
        :class="institutionClass ?? 'text-xs text-on-surface-variant'"
        :style="accent && !institutionClass ? { color: accent } : undefined"
      >
        {{ edu.institution }}
      </p>
      <p v-if="edu.field" :class="fieldClass ?? 'text-xs text-on-surface-variant'">{{ edu.field }}</p>
      <p v-if="period" :class="periodClass ?? 'text-xs text-on-surface-variant'">{{ period }}</p>
    </template>
  </div>
</template>
