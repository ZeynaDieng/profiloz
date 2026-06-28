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
  <CoverLetterShell template-name="Moderne">
    <div class="font-sans text-[10.5pt] leading-[1.75] text-[#1e293b]">
      <!-- En-tête : deux colonnes avec ligne de séparation basse -->
      <header class="mb-10">
        <div
          class="flex justify-between items-end gap-6 pb-5"
          style="border-bottom: 2px solid var(--color-secondary)"
        >
          <!-- Expéditeur -->
          <div v-if="senderLines.length" class="space-y-[2px]">
            <p
              class="text-[14pt] font-bold tracking-tight text-[#0f172a] leading-tight"
            >
              {{ senderLines[0] }}
            </p>
            <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              <span
                v-for="(line, i) in senderLines.slice(1)"
                :key="i"
                class="text-[9pt] text-[#64748b] leading-snug"
                >{{ line }}</span
              >
            </div>
          </div>

          <!-- Date -->
          <p class="text-[9pt] text-[#94a3b8] shrink-0 pb-0.5 tabular-nums">
            {{ formattedDate }}
          </p>
        </div>

        <!-- Barre d'accentuation secondaire sous la ligne principale -->
        <div
          class="h-[3px] w-12 mt-[3px] rounded-full"
          style="
            background: color-mix(
              in srgb,
              var(--color-secondary) 40%,
              transparent
            );
          "
        />
      </header>

      <!-- Objet -->
      <div
        v-if="letter.position"
        class="flex items-baseline gap-3 mb-8 text-[9.5pt]"
      >
        <span
          class="font-bold uppercase tracking-[0.1em] shrink-0"
          style="color: var(--color-secondary)"
        >
          Objet
        </span>
        <span
          class="h-px flex-1 self-center"
          style="
            background: color-mix(
              in srgb,
              var(--color-secondary) 25%,
              transparent
            );
          "
        />
        <span class="text-[#334155] font-medium"
          >Candidature — {{ letter.position }}</span
        >
      </div>

      <!-- Destinataire -->
      <div
        v-if="recipientLines.length"
        class="mb-9 text-[9.5pt] text-[#475569] space-y-[2px]"
      >
        <p class="font-semibold text-[#0f172a]">{{ recipientLines[0] }}</p>
        <p
          v-for="(line, i) in recipientLines.slice(1)"
          :key="i"
          class="leading-snug"
        >
          {{ line }}
        </p>
      </div>

      <!-- Salutation -->
      <p class="mb-6 font-medium text-[#0f172a]">{{ greeting }}</p>

      <!-- Corps -->
      <div class="space-y-[1.1em] text-[#334155]">
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
      <p class="mt-10 mb-8 text-[10pt] text-[#475569]">{{ closing }}</p>

      <!-- Signature -->
      <div v-if="letter.senderName" class="flex items-center gap-4">
        <div class="flex flex-col gap-1">
          <p
            class="font-bold text-[11pt] text-[#0f172a] tracking-tight leading-none"
          >
            {{ letter.senderName }}
          </p>
          <div
            class="h-[2px] w-full rounded-full"
            style="background: var(--color-secondary)"
          />
        </div>
      </div>
    </div>
  </CoverLetterShell>
</template>
