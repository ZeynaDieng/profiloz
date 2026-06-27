<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const { formattedDate, greeting, paragraphs, closing, senderLines, recipientLines } = useCoverLetterFormat(
  () => props.letter,
)
</script>

<template>
  <CoverLetterShell template-name="Créatif">
    <div class="font-sans text-[10.5pt] leading-[1.7]">
      <div class="relative mb-10">
        <div class="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary to-primary rounded-full" />
        <div class="pl-4">
          <p v-if="letter.senderName" class="text-xl font-bold text-[#0f172a]">{{ letter.senderName }}</p>
          <p v-if="letter.position" class="text-secondary italic mt-1">→ {{ letter.position }}</p>
          <div v-if="senderLines.length > 1" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</span>
          </div>
        </div>
      </div>

      <p class="text-right text-xs text-on-surface-variant mb-8">{{ formattedDate }}</p>

      <div v-if="recipientLines.length" class="mb-8 text-sm bg-surface-container-low rounded-lg p-4">
        <p v-for="(line, i) in recipientLines" :key="i">{{ line }}</p>
      </div>

      <p class="mb-5 font-medium">{{ greeting }}</p>

      <div class="space-y-4 text-[#334155]">
        <p v-for="(paragraph, i) in paragraphs" :key="i" class="text-justify">{{ paragraph }}</p>
      </div>

      <p class="mt-10 text-sm italic text-on-surface-variant">{{ closing }}</p>
      <p v-if="letter.senderName" class="mt-4 font-bold text-secondary">{{ letter.senderName }}</p>
    </div>
  </CoverLetterShell>
</template>
