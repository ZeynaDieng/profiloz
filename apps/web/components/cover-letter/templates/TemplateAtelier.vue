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
  <CoverLetterShell template-name="Atelier">
    <div class="font-serif text-[11pt] leading-[1.8] text-amber-950 bg-[#fdfaf6] -mx-[20mm] -my-[20mm] px-[20mm] py-[20mm] min-h-full">
      <!-- Minimalist Header -->
      <div class="grid grid-cols-12 gap-6 mb-10 pb-6 border-b border-amber-900/20">
        <div class="col-span-8">
          <h2 class="text-xl font-bold tracking-wide text-amber-950">
            {{ senderLines[0] || letter.fullName }}
          </h2>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs font-sans text-amber-900/60">
            <span v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</span>
          </div>
        </div>
        <div class="col-span-4 text-right text-xs font-sans text-amber-900/60">
          <p class="mb-4">{{ formattedDate }}</p>
          <div v-if="recipientLines.length" class="text-left font-serif text-[10pt] text-amber-900 bg-amber-50/50 p-3 rounded border border-amber-900/10">
            <p class="font-bold mb-1">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="leading-snug text-amber-900/80">{{ line }}</p>
          </div>
        </div>
      </div>

      <!-- Object -->
      <div v-if="letter.position" class="mb-6 pb-2 border-b border-amber-900/10">
        <p class="text-xs uppercase tracking-widest text-amber-800 font-sans">
          Objet : Candidature au poste de {{ letter.position }}
        </p>
      </div>

      <!-- Body -->
      <div class="space-y-6 text-justify text-amber-950 leading-[1.8]">
        <p class="font-bold">{{ greeting }}</p>
        <p v-for="(para, i) in paragraphs" :key="i" class="indent-6">{{ para }}</p>
        <div class="pt-8">
          <p class="italic mb-8">{{ closing }}</p>
          <p class="font-bold text-right text-amber-950 pr-4">{{ letter.fullName }}</p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
