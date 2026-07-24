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
  <CoverLetterShell template-name="Élégance">
    <div class="font-serif text-[11pt] leading-[1.8] text-slate-800 bg-[#faf9f6] -mx-[20mm] -my-[20mm] px-[25mm] py-[25mm] min-h-full">
      <!-- Header -->
      <div class="text-center mb-12 border-b border-slate-200 pb-8">
        <h2 class="text-2xl font-serif tracking-widest uppercase text-slate-900 mb-2">
          {{ senderLines[0] || letter.fullName }}
        </h2>
        <div class="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-xs text-slate-400 font-sans">
          <span v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</span>
        </div>
      </div>

      <div class="flex justify-between items-start mb-10 gap-8">
        <div class="text-slate-400 italic text-[10pt] font-sans">{{ formattedDate }}</div>
        <div v-if="recipientLines.length" class="text-left space-y-0.5 text-[10.5pt]">
          <p class="font-bold text-slate-900 mb-1">{{ recipientLines[0] }}</p>
          <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="text-slate-600 leading-snug">{{ line }}</p>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-8 border-b border-slate-200 pb-2">
        <p class="text-xs uppercase tracking-wider text-slate-500 font-sans">
          <span class="font-bold">Objet&nbsp;:</span>
          <span class="ml-2 font-serif italic text-slate-800">Candidature au poste de {{ letter.position }}</span>
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-6 text-justify text-slate-800">
        <p class="font-bold">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="indent-6 leading-relaxed">{{ para }}</p>
        <div class="pt-6">
          <p class="italic mb-8">{{ closing }}</p>
          <p class="font-bold text-right text-slate-900 pr-4">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
