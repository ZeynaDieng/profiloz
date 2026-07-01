<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    filled?: boolean
    class?: string
  }>(),
  { filled: false },
)

/** Fallback lisible si la police Material Symbols ne charge pas (évite « task_alt », « _alt », etc.). */
const FALLBACK_GLYPHS: Record<string, string> = {
  add: '+',
  arrow_back: '←',
  arrow_forward: '→',
  check: '✓',
  check_circle: '✓',
  chevron_right: '›',
  close: '×',
  dashboard: '▦',
  delete: '🗑',
  description: '📄',
  download: '↓',
  help: '?',
  home: '⌂',
  mail: '✉',
  menu: '☰',
  notifications: '🔔',
  open_in_new: '↗',
  payments: '₣',
  picture_as_pdf: 'PDF',
  redeem: '🎁',
  task_alt: '✓',
  auto_awesome: '✦',
}

const filledStyle = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
}

const fontReady = ref(true)

onMounted(() => {
  if (!import.meta.client || !('fonts' in document)) return

  document.fonts
    .load('1em "Material Symbols Outlined"')
    .then(() => {
      fontReady.value = document.fonts.check('1em "Material Symbols Outlined"')
    })
    .catch(() => {
      fontReady.value = false
    })
})
</script>

<template>
  <span
    v-if="fontReady"
    class="material-symbols-outlined inline-block align-middle"
    :class="props.class"
    :style="props.filled ? filledStyle : undefined"
    aria-hidden="true"
  >
    {{ props.name }}
  </span>
  <span
    v-else
    class="inline-flex align-middle items-center justify-center font-semibold leading-none"
    :class="props.class"
    aria-hidden="true"
  >
    {{ FALLBACK_GLYPHS[props.name] ?? '•' }}
  </span>
</template>
