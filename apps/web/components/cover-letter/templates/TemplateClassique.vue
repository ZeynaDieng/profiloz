<script setup lang="ts">
import type { CoverLetterSnapshot } from "~/types/cover-letter";

const props = defineProps<{ letter: CoverLetterSnapshot }>();
const {
  formattedDate,
  greeting,
  paragraphs,
  closing,
  senderLines,
  recipientLines,
} = useCoverLetterFormat(() => props.letter);
</script>

<template>
  <CoverLetterShell template-name="Classique">
    <div class="font-serif text-[11pt] leading-[1.8] text-[#0b1c30]">
      <!-- En-tête : disposition deux colonnes à la française -->
      <div class="flex justify-between items-start mb-12 gap-8">
        <!-- Expéditeur (gauche) -->
        <div v-if="senderLines.length" class="text-[10pt] space-y-px">
          <p class="font-semibold text-[11.5pt] tracking-wide mb-1">
            {{ senderLines[0] }}
          </p>
          <p
            v-for="(line, i) in senderLines.slice(1)"
            :key="i"
            class="text-[#45464d] leading-snug"
          >
            {{ line }}
          </p>
        </div>

        <!-- Date + Destinataire (droite) -->
        <div class="text-right text-[10pt] shrink-0">
          <p class="text-[#45464d] mb-6 italic">{{ formattedDate }}</p>

          <div v-if="recipientLines.length" class="text-left space-y-px">
            <p class="font-semibold mb-0.5">{{ recipientLines[0] }}</p>
            <p
              v-for="(line, i) in recipientLines.slice(1)"
              :key="i"
              class="text-[#45464d] leading-snug"
            >
              {{ line }}
            </p>
          </div>
        </div>
      </div>

      <!-- Objet -->
      <div v-if="letter.position" class="mb-8 pb-2 border-b border-[#c8c9cf]">
        <p class="text-[10pt] tracking-wide">
          <span class="font-bold">Objet&nbsp;:</span>
          <span class="ml-1"
            >Candidature au poste de {{ letter.position }}</span
          >
        </p>
      </div>

      <!-- Salutation -->
      <p class="mb-7 text-[10.5pt]">{{ greeting }}</p>

      <!-- Corps -->
      <div class="space-y-0">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          class="text-justify mb-[1.1em]"
          :class="i > 0 ? 'indent-[2em]' : ''"
          style="hyphens: auto; -webkit-hyphens: auto; text-align-last: left"
        >
          {{ paragraph }}
        </p>
      </div>

      <!-- Formule de politesse -->
      <p class="mt-10 mb-14 text-[10.5pt]">{{ closing }}</p>

      <!-- Signature -->
      <div class="flex justify-end">
        <div class="text-center">
          <div class="w-24 h-px bg-[#b0b2bb] mx-auto mb-3" />
          <p
            v-if="letter.senderName"
            class="font-semibold text-[10.5pt] tracking-widest uppercase text-[#0b1c30]"
            style="font-variant: small-caps; letter-spacing: 0.08em"
          >
            {{ letter.senderName }}
          </p>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
