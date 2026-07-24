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
  <CoverLetterShell template-name="Cabinet">
    <div class="font-serif text-[11pt] leading-[1.8] text-slate-900 bg-white min-h-full">
      <!-- Traditional Elegant Header -->
      <div class="flex justify-between items-start mb-12 pb-6 border-b-4 border-[#0f1e36] gap-8">
        <div v-if="senderLines.length" class="text-[10pt] space-y-0.5">
          <p class="font-bold text-[12pt] text-[#0f1e36] tracking-wide mb-1">{{ senderLines[0] }}</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i" class="text-slate-600 leading-snug font-sans">{{ line }}</p>
        </div>
        <div class="text-right text-[10pt] font-sans">
          <p class="text-slate-500 mb-6 italic">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left space-y-0.5 font-serif">
            <p class="font-bold text-[#0f1e36] mb-1">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="text-slate-600 leading-snug">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-8 pb-1 border-b border-[#0f1e36] w-fit">
        <p class="text-[10pt] font-sans tracking-wide">
          <span class="font-bold text-[#0f1e36]">Objet&nbsp;:</span>
          <span class="ml-2 font-serif text-slate-800">Candidature au poste de {{ letter.position }}</span>
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-6 text-justify text-slate-800 text-[11pt] leading-[1.8]">
        <p class="font-bold">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="indent-8">{{ para }}</p>
        <div class="pt-8 text-right font-sans">
          <p class="italic mb-10 text-slate-500 text-[10pt]">{{ closing }}</p>
          <p class="font-bold text-[#0f1e36] text-[11.5pt] tracking-wide">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
