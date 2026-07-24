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
  <CoverLetterShell template-name="Chronos">
    <div class="font-sans text-[11pt] leading-[1.8] text-slate-800 bg-white min-h-full">
      <!-- Minimal Header -->
      <div class="flex justify-between items-start mb-10 pb-6 border-b gap-8">
        <div v-if="senderLines.length" class="space-y-0.5">
          <p class="font-extrabold text-xl text-slate-900 leading-none">{{ senderLines[0] }}</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i" class="text-slate-400 text-xs font-semibold">{{ line }}</p>
        </div>
        <div class="text-right text-xs text-slate-400 font-semibold">
          <p class="mb-4">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left space-y-0.5 text-xs text-slate-700">
            <p class="font-bold text-slate-900 mb-0.5">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="leading-snug text-slate-500">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-6 pb-2 border-b">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-900">
          Objet : Candidature au poste de {{ letter.position }}
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-5 text-justify text-slate-800 leading-relaxed">
        <p class="font-bold text-slate-900">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="leading-relaxed">{{ para }}</p>
        <div class="pt-6 border-t mt-8">
          <p class="italic mb-6 text-slate-500">{{ closing }}</p>
          <p class="font-bold text-slate-900 text-lg">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
