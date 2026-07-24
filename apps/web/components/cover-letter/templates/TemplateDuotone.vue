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
  <CoverLetterShell template-name="DuoTone">
    <div class="grid grid-cols-12 gap-0 min-h-full">
      <!-- Left side (Colored/Tinted) -->
      <aside class="col-span-4 bg-slate-100 -ml-[20mm] -my-[20mm] p-6 text-slate-800 flex flex-col gap-6">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-slate-900 leading-none">
            {{ senderLines[0] || letter.fullName }}
          </h2>
          <p class="text-[8pt] uppercase tracking-widest text-slate-500 mt-2 font-bold">{{ letter.position || 'Candidat' }}</p>
        </div>

        <div class="space-y-2 text-[8.5pt]">
          <h3 class="text-[7.5pt] uppercase font-bold tracking-wider text-slate-400">Coordonnées</h3>
          <div v-for="(line, i) in senderLines.slice(1)" :key="i" class="break-all text-slate-600 leading-snug">{{ line }}</div>
        </div>
      </aside>

      <!-- Right side (White) -->
      <main class="col-span-8 pl-6 py-2">
        <div class="flex justify-between items-start mb-8 gap-4 text-xs text-slate-400 font-semibold">
          <div>{{ formattedDate }}</div>
          <div v-if="recipientLines.length" class="text-left font-serif text-[10pt] text-slate-800">
            <p class="font-bold mb-1 text-slate-900">{{ recipientLines[0] }}</p>
            <p v-for="(line, i) in recipientLines.slice(1)" :key="i" class="leading-snug text-slate-600">{{ line }}</p>
          </div>
        </div>

        <!-- Body -->
        <div class="space-y-5 text-justify text-slate-800 text-[10pt] leading-[1.6]">
          <p class="font-bold text-slate-950">{{ greeting }}</p>
          <p v-for="(para, i) in paragraphs" :key="i">{{ para }}</p>
          <div class="pt-6 border-t border-slate-100 mt-8">
            <p class="italic mb-6 text-slate-500">{{ closing }}</p>
            <p class="font-bold text-slate-950 text-[11pt]">{{ letter.fullName }}</p>
          </div>
        </div>
      </main>
    </div>
  </CoverLetterShell>
</template>
