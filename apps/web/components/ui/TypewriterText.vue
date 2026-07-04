<script setup lang="ts">
import type { TypewriterLoopMode, TypewriterSegment } from '~/composables/useTypewriter'

const props = withDefaults(
  defineProps<{
    segments: TypewriterSegment[]
    tag?: string
    active?: boolean
    speed?: number
    eraseSpeed?: number
    delay?: number
    pauseTyped?: number
    pauseEmpty?: number
    loop?: boolean
    loopMode?: TypewriterLoopMode
    cursor?: boolean
    class?: string
  }>(),
  {
    tag: 'span',
    active: true,
    speed: 92,
    eraseSpeed: 48,
    delay: 220,
    pauseTyped: 3400,
    pauseEmpty: 1100,
    loop: false,
    loopMode: 'full',
    cursor: true,
    class: '',
  },
)

const emit = defineEmits<{
  complete: []
}>()

const segmentRef = computed(() => props.segments)
const activeRef = computed(() => props.active)
const loopRef = computed(() => props.loop)

const { flatMeta, visibleSlice, visibleCount, isComplete, showCursor, fullText } = useTypewriter(
  segmentRef,
  {
    active: activeRef,
    loop: loopRef,
    loopMode: props.loopMode,
    speed: props.speed,
    eraseSpeed: props.eraseSpeed,
    delay: props.delay,
    pauseTyped: props.pauseTyped,
    pauseEmpty: props.pauseEmpty,
  },
)

const cursorSegmentIndex = computed(() => {
  const meta = flatMeta.value
  if (meta.length === 0) return 0

  const count = visibleCount.value
  for (let i = meta.length - 1; i >= 0; i -= 1) {
    const segment = meta[i]!
    if (count > segment.start && count <= segment.end) return i
  }

  for (let i = meta.length - 1; i >= 0; i -= 1) {
    if (count >= meta[i]!.end) return i
  }

  return 0
})

function segmentBody(segment: (typeof flatMeta.value)[number]) {
  const text = visibleSlice(segment)
  if (text.length <= 1) return ''
  return text.slice(0, -1)
}

function segmentLastChar(segment: (typeof flatMeta.value)[number]) {
  const text = visibleSlice(segment)
  if (!text) return ''
  return text.slice(-1)
}

watch(isComplete, (done) => {
  if (done) emit('complete')
}, { immediate: true })
</script>

<template>
  <component
    :is="tag"
    :class="props.class"
    :aria-label="fullText"
  >
    <span
      v-for="(segment, index) in flatMeta"
      :key="index"
      :class="segment.class"
    >
      {{ segmentBody(segment) }}<span
        v-if="segmentLastChar(segment)"
        :key="`${index}-${visibleCount}`"
        class="typewriter-char"
      >{{ segmentLastChar(segment) }}</span><span
        v-if="cursor && showCursor && cursorSegmentIndex === index"
        class="typewriter-cursor"
        aria-hidden="true"
      />
    </span>
  </component>
</template>
