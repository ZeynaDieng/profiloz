<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

defineProps<{
  letter: CoverLetterSnapshot
  align?: 'left' | 'center' | 'right'
}>()
</script>

<template>
  <div
    class="mt-6 space-y-2"
    :class="align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'"
  >
    <div v-if="letter.signatureUrl" class="inline-block">
      <img
        :src="letter.signatureUrl"
        alt="Signature"
        class="max-h-16 max-w-[180px] object-contain block my-1"
        :class="align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto'"
      />
    </div>
    <p
      v-if="letter.senderName"
      class="font-semibold text-[10.5pt] tracking-wide text-current"
    >
      {{ letter.senderName }}
    </p>
  </div>
</template>
