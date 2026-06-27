<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const { formattedDate, greeting, paragraphs, closing, senderLines, recipientLines } = useCoverLetterFormat(
  () => props.letter,
)
</script>

<template>
  <CoverLetterShell template-name="Accent">
    <div class="font-sans text-[10.5pt] leading-[1.7]">
      <div class="bg-secondary text-white -mx-[20mm] px-[20mm] py-6 mb-10">
        <p v-if="letter.senderName" class="text-lg font-bold">{{ letter.senderName }}</p>
        <p v-if="letter.position" class="text-white/90 text-sm mt-1">Candidature — {{ letter.position }}</p>
        <p class="text-white/70 text-xs mt-3">{{ formattedDate }}</p>
      </div>

      <div class="grid grid-cols-[1fr_2fr] gap-8 mb-8 text-sm">
        <div v-if="senderLines.length > 1" class="text-on-surface-variant space-y-0.5">
          <p class="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Expéditeur</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</p>
        </div>
        <div v-if="recipientLines.length">
          <p class="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Destinataire</p>
          <p v-for="(line, i) in recipientLines" :key="i">{{ line }}</p>
        </div>
      </div>

      <p class="mb-5 font-medium text-[#0f172a]">{{ greeting }}</p>

      <div class="space-y-4 text-on-surface-variant">
        <p v-for="(paragraph, i) in paragraphs" :key="i" class="text-justify">{{ paragraph }}</p>
      </div>

      <p class="mt-10 text-sm text-[#334155]">{{ closing }}</p>
    </div>
  </CoverLetterShell>
</template>

<style scoped>
:deep(.letter-a4) {
  padding-top: 0;
}
</style>
