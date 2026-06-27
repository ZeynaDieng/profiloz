<script setup lang="ts">
import type { Education } from '@profiloz/shared'
import { formatEducationPeriod } from '~/utils/education'

const props = defineProps<{
  edu: Education
  accent?: string
  institutionClass?: string
  fieldClass?: string
  periodClass?: string
}>()

const period = computed(() => formatEducationPeriod(props.edu.startDate, props.edu.endDate))
</script>

<template>
  <div class="education-entry">
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
  </div>
</template>
