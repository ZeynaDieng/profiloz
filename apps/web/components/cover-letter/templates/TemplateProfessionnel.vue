<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const { formattedDate, greeting, paragraphs, closing, senderLines, recipientLines } = useCoverLetterFormat(
  () => props.letter,
)
</script>

<template>
  <CoverLetterShell template-name="Professionnel">
    <div class="font-sans text-[10.5pt] leading-[1.65] text-[#111827]">
      <div class="flex justify-between border-b border-[#d1d5db] pb-6 mb-8">
        <div>
          <p v-if="letter.senderName" class="text-base font-bold uppercase tracking-wide">{{ letter.senderName }}</p>
          <div v-if="senderLines.length > 1" class="mt-2 text-xs text-[#6b7280] space-y-0.5">
            <p v-for="(line, i) in senderLines.slice(1)" :key="i">{{ line }}</p>
          </div>
        </div>
        <p class="text-xs text-[#6b7280]">{{ formattedDate }}</p>
      </div>

      <div v-if="recipientLines.length" class="mb-8 pl-4 border-l-2 border-[#9ca3af] text-sm">
        <p v-for="(line, i) in recipientLines" :key="i">{{ line }}</p>
      </div>

      <p class="mb-4">{{ greeting }}</p>
      <p v-if="letter.position" class="font-semibold mb-6 bg-[#f3f4f6] px-3 py-2 text-sm inline-block">
        Objet : Candidature pour le poste de {{ letter.position }}
      </p>

      <div class="space-y-4 text-[#374151]">
        <p v-for="(paragraph, i) in paragraphs" :key="i" class="text-justify">{{ paragraph }}</p>
      </div>

      <p class="mt-10">{{ closing }}</p>
      <p v-if="letter.senderName" class="mt-8 text-sm font-semibold">{{ letter.senderName }}</p>
    </div>
  </CoverLetterShell>
</template>
