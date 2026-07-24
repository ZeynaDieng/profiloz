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
  <CoverLetterShell template-name="Académique">
    <div class="font-serif text-[11pt] leading-[1.8] text-slate-900 bg-white min-h-full">
      <!-- Centered Header -->
      <div class="text-center mb-10 border-b-2 border-slate-900 pb-6">
        <h2 class="text-xl font-bold tracking-wide uppercase mb-2">
          {{ senderLines[0] || letter.fullName }}
        </h2>
        <div class="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-xs text-slate-500 font-sans">
          <span v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</span>
        </div>
      </div>

      <div class="flex justify-between items-start mb-8 gap-8 text-xs font-sans text-slate-500">
        <div>{{ formattedDate }}</div>
        <div v-if="recipientLines.length" class="text-left font-serif text-sm text-slate-800">
          <p class="font-bold mb-1">{{ recipientLines[0] }}</p>
          <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="leading-snug text-slate-600">{{ line }}</p>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-6 pb-1 border-b border-slate-300">
        <p class="text-xs font-sans tracking-widest text-slate-500">
          OBJET : Candidature au poste de {{ letter.position }}
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-6 text-justify text-slate-800 leading-[1.8]">
        <p class="font-bold">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="indent-8">{{ para }}</p>
        <div class="pt-8">
          <p class="italic mb-10">{{ closing }}</p>
          <p class="font-bold text-right pr-4">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
