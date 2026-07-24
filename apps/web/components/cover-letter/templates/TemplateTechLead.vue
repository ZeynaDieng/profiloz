<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const {
  formattedDate,
  greeting,
  paragraphs,
  closing,
  senderLines,
  recipientLines,
} = useCoverLetterFormat(() => props.letter)
</script>

<template>
  <CoverLetterShell template-name="Tech Lead">
    <div class="font-mono text-[10pt] leading-[1.6] text-slate-300 bg-slate-900 -mx-[20mm] -my-[20mm] px-[20mm] py-[20mm] min-h-full">
      <!-- Header -->
      <div class="flex justify-between items-start mb-10 border-b border-slate-700 pb-6 gap-6">
        <div v-if="senderLines.length" class="space-y-1">
          <p class="font-bold text-white text-[11pt]">{{ senderLines[0] }}</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i" class="text-slate-400 text-[9pt]">{{ line }}</p>
        </div>
        <div class="text-right space-y-1">
          <p class="text-slate-400 italic mb-4 text-[9pt]">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left bg-slate-800 p-3 rounded border border-slate-700">
            <p class="font-bold text-white text-[9.5pt] mb-1">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="text-slate-400 text-[8.5pt]">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-8">
        <p class="text-[9.5pt] text-white font-bold">
          <span>Subject:</span>
          <span class="ml-2 font-normal text-slate-300">Candidature - {{ letter.position }}</span>
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-5 text-slate-300 text-[9.5pt]">
        <p class="font-bold text-white">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="text-justify indent-4">{{ para }}</p>
        <div class="pt-4 text-right">
          <p class="italic mb-8">{{ closing }}</p>
          <p class="font-bold text-white">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
