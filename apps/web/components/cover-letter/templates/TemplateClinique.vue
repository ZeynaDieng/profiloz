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
  <CoverLetterShell template-name="Clinique">
    <div class="font-sans text-[11pt] leading-[1.8] text-slate-800 bg-white min-h-full">
      <!-- Clean Medical Header -->
      <div class="flex justify-between items-start mb-10 pb-6 border-b border-teal-200 gap-8">
        <div v-if="senderLines.length" class="space-y-0.5">
          <p class="font-bold text-xl text-teal-900">{{ senderLines[0] }}</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i" class="text-teal-600 text-xs font-semibold">{{ line }}</p>
        </div>
        <div class="text-right text-xs text-slate-500 font-semibold">
          <p class="mb-4">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left space-y-0.5 text-xs text-slate-700">
            <p class="font-bold text-teal-900 mb-0.5">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="leading-snug text-slate-500">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-6 pb-2 border-b border-teal-100">
        <p class="text-xs font-bold uppercase tracking-wider text-teal-800">
          Objet : Candidature au poste de {{ letter.position }}
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-5 text-justify text-slate-800 leading-relaxed">
        <p class="font-bold text-teal-950">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="leading-relaxed">{{ para }}</p>
        <div class="pt-6 border-t border-teal-50 mt-8">
          <p class="italic mb-6 text-slate-500">{{ closing }}</p>
          <p class="font-bold text-teal-900 text-lg">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
