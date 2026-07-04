<script setup lang="ts">
const props = defineProps<{
  end: number
  suffix?: string
  label: string
}>()

const { target, display } = useAnimatedCounter(props.end, {
  suffix: props.suffix ?? '',
  duration: 1600,
})
</script>

<template>
  <div ref="target" class="text-center">
    <p class="text-xl sm:text-2xl md:text-3xl font-bold text-secondary tabular-nums">
      {{ display }}
    </p>
    <p class="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 uppercase tracking-wide font-medium">
      {{ label }}
    </p>
  </div>
</template>
