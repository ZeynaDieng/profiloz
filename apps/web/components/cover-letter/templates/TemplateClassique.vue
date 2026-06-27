<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'

const props = defineProps<{ letter: CoverLetterSnapshot }>()
const { formattedDate, greeting, paragraphs, closing, senderLines, recipientLines } = useCoverLetterFormat(
  () => props.letter,
)
</script>

<template>
  <CoverLetterShell template-name="Classique">
    <div class="font-serif text-[11pt] leading-[1.75] text-[#0b1c30]">
      <div v-if="senderLines.length" class="mb-10 text-sm">
        <p v-for="(line, i) in senderLines" :key="i">{{ line }}</p>
      </div>

      <p class="text-right text-[#45464d] text-[10pt] mb-10">{{ formattedDate }}</p>

      <div v-if="recipientLines.length" class="mb-8">
        <p v-for="(line, i) in recipientLines" :key="i">{{ line }}</p>
      </div>

      <p class="mb-6">{{ greeting }}</p>

      <p v-if="letter.position" class="font-bold mb-6">
        Objet : Candidature — {{ letter.position }}
      </p>

      <p v-for="(paragraph, i) in paragraphs" :key="i" class="mb-4 text-justify">
        {{ paragraph }}
      </p>

      <p class="mt-8">{{ closing }}</p>

      <p v-if="letter.senderName" class="mt-10 font-semibold">{{ letter.senderName }}</p>
    </div>
  </CoverLetterShell>
</template>
