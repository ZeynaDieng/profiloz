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
  <CoverLetterShell template-name="Impact">
    <div class="font-sans text-[11pt] leading-[1.7] text-slate-800 bg-white min-h-full">
      <!-- Modern header -->
      <div class="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-900 gap-6">
        <div v-if="senderLines.length" class="space-y-0.5">
          <p class="font-black text-xl tracking-tight uppercase text-slate-900">{{ senderLines[0] }}</p>
          <p v-for="(line, i) in senderLines.slice(1)" :key="i" class="text-slate-500 text-xs font-medium">{{ line }}</p>
        </div>
        <div class="text-right text-xs text-slate-400 font-medium">
          <p class="mb-4">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p class="font-bold text-slate-900 mb-0.5 text-xs">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="text-slate-500 leading-snug">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-8 bg-slate-900 text-white px-3 py-2 rounded font-bold text-sm inline-block">
        Objet : Candidature au poste de {{ letter.position }}
      </div>

      <!-- Body -->
      <div class="space-y-5 text-justify text-slate-800">
        <p class="font-bold text-lg text-slate-950">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="leading-relaxed">{{ para }}</p>
        <div class="pt-6 border-t border-slate-100 mt-8">
          <p class="italic mb-6 text-slate-600">{{ closing }}</p>
          <p class="font-black text-lg text-slate-950">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
