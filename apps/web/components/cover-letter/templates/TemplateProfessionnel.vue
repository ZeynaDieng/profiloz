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
  <CoverLetterShell template-name="Professionnel">
    <div class="font-sans text-[10.5pt] leading-[1.7] text-[#111827]">
      <!-- En-tête -->
      <header class="mb-9">
        <div class="flex justify-between items-start gap-6">
          <!-- Identité expéditeur -->
          <div>
            <p
              v-if="letter.senderName"
              class="text-[13pt] font-bold tracking-[0.06em] uppercase text-[#0a0a0a] leading-tight"
            >
              {{ letter.senderName }}
            </p>
            <div
              v-if="senderLines.length > 1"
              class="mt-2 text-[9pt] text-[#6b7280] leading-snug space-y-[1px]"
            >
              <p v-for="(line, i) in senderLines.slice(1)" :key="i">
                {{ line }}
              </p>
            </div>
          </div>

          <!-- Date alignée à droite -->
          <div class="text-right shrink-0 mt-0.5">
            <p class="text-[9pt] text-[#6b7280] tabular-nums">
              {{ formattedDate }}
            </p>
          </div>
        </div>

        <!-- Double filet sous l'en-tête -->
        <div class="mt-5 space-y-[3px]">
          <div class="h-[2px] w-full bg-[#111827]" />
          <div class="h-px w-full bg-[#d1d5db]" />
        </div>
      </header>

      <!-- Destinataire -->
      <div v-if="recipientLines.length" class="mb-8 text-[10pt]">
        <p
          class="text-[8px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] mb-2"
        >
          À l'attention de
        </p>
        <div class="pl-3 border-l-[3px] border-[#111827] space-y-[1px]">
          <p class="font-semibold text-[#0a0a0a]">{{ recipientLines[0] }}</p>
          <p
            v-for="(line, i) in recipientLines.slice(1)"
            :key="i"
            class="text-[9.5pt] text-[#374151] leading-snug"
          >
            {{ line }}
          </p>
        </div>
      </div>

      <!-- Objet -->
      <div
        v-if="letter.position"
        class="mb-8 border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3"
      >
        <p
          class="text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] mb-1"
        >
          Objet
        </p>
        <p class="text-[10.5pt] font-semibold text-[#0a0a0a]">
          Candidature pour le poste de {{ letter.position }}
        </p>
      </div>

      <!-- Salutation -->
      <p class="mb-6 text-[10.5pt]">{{ greeting }}</p>

      <!-- Corps -->
      <div class="space-y-[1.1em] text-[#1f2937]">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          class="text-justify"
          style="hyphens: auto; -webkit-hyphens: auto; text-align-last: left"
        >
          {{ paragraph }}
        </p>
      </div>

      <!-- Formule de politesse -->
      <p class="mt-10 mb-12 text-[10.5pt]">{{ closing }}</p>

      <!-- Signature -->
      <div class="flex justify-between items-end">
        <div v-if="letter.senderName">
          <!-- Ligne pointillée pour le paraphe -->
          <div class="w-40 mb-3" style="border-top: 1px dashed #9ca3af" />
          <p
            class="text-[9.5pt] font-bold uppercase tracking-[0.06em] text-[#0a0a0a]"
          >
            {{ letter.senderName }}
          </p>
          <p v-if="letter.position" class="text-[8.5pt] text-[#6b7280] mt-0.5">
            Candidat — {{ letter.position }}
          </p>
        </div>

        <!-- Tampon décoratif -->
        <div class="text-right opacity-10 select-none" aria-hidden="true">
          <div
            class="w-14 h-14 border-[3px] border-[#111827] rounded-full flex items-center justify-center"
          >
            <span
              class="text-[8px] font-black uppercase tracking-widest text-[#111827] leading-none text-center px-1"
            >
              LM
            </span>
          </div>
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
