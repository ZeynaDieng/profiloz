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
  <CoverLetterShell template-name="ATS Friendly">
    <div class="font-sans text-sm leading-normal text-black bg-white min-h-full">
      <!-- Plain Text Header -->
      <div class="text-center mb-6">
        <h2 class="text-lg font-bold uppercase mb-1">
          {{ senderLines[0] || letter.fullName }}
        </h2>
        <div class="text-xs text-slate-600">
          {{ senderLines.slice(1).join('  |  ') }}
        </div>
      </div>

      <div class="flex justify-between items-start mb-6 text-xs text-slate-700">
        <div>{{ formattedDate }}</div>
        <div v-if="recipientLines.length" class="text-left font-bold">
          <p class="mb-0.5">{{ recipientLines[0] }}</p>
          <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="font-normal">{{ line }}</p>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-4 border-t border-b border-black py-1 font-bold">
        Objet : Candidature au poste de {{ letter.position }}
      </div>

      <!-- Body -->
      <div class="space-y-4 text-justify text-black">
        <p class="font-bold">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="leading-relaxed">{{ para }}</p>
        <div class="pt-4 border-t border-slate-200 mt-6">
          <p class="italic mb-6 text-slate-600">{{ closing }}</p>
          <p class="font-bold text-lg text-black">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
