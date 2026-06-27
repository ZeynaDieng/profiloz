<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const { formattedDate, greeting, paragraphs, closing, senderLines, recipientLines } = useCoverLetterFormat(
  () => props.letter,
)
</script>

<template>
  <CoverLetterShell template-name="Moderne">
    <div class="font-sans text-[10.5pt] leading-[1.7] text-[#1e293b]">
      <header class="flex justify-between items-start gap-6 mb-10 pb-4 border-b-2 border-secondary">
        <div v-if="senderLines.length" class="text-sm space-y-0.5">
          <p v-for="(line, i) in senderLines" :key="i" :class="i === 0 ? 'font-bold text-base text-[#0f172a]' : ''">
            {{ line }}
          </p>
        </div>
        <p class="text-xs text-on-surface-variant shrink-0">{{ formattedDate }}</p>
      </header>

      <div v-if="recipientLines.length" class="mb-8 text-sm text-on-surface-variant">
        <p v-for="(line, i) in recipientLines" :key="i">{{ line }}</p>
      </div>

      <p class="mb-5 font-medium">{{ greeting }}</p>

      <p v-if="letter.position" class="text-secondary font-bold text-sm uppercase tracking-wide mb-6">
        Objet : {{ letter.position }}
      </p>

      <div class="space-y-4">
        <p v-for="(paragraph, i) in paragraphs" :key="i" class="text-justify text-on-surface-variant">
          {{ paragraph }}
        </p>
      </div>

      <p class="mt-10 text-sm">{{ closing }}</p>
      <p v-if="letter.senderName" class="mt-6 font-bold text-secondary">{{ letter.senderName }}</p>
    </div>
  </CoverLetterShell>
</template>
