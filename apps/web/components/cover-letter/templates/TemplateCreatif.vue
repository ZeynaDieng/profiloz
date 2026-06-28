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
  <CoverLetterShell template-name="Créatif">
    <div class="font-sans text-[10.5pt] leading-[1.7] text-[#1e293b]">
      <!-- En-tête structuré -->
      <div class="relative mb-12">
        <!-- Barre verticale gradient étendue -->
        <div
          class="absolute -left-[20mm] top-0 bottom-0 w-[5px] rounded-r-full"
          style="
            background: linear-gradient(
              to bottom,
              var(--color-secondary),
              var(--color-primary)
            );
          "
        />

        <div class="flex justify-between items-start gap-6">
          <!-- Identité -->
          <div>
            <p
              class="text-[8px] uppercase tracking-[0.2em] text-secondary font-bold mb-2 opacity-70"
            >
              Candidat
            </p>
            <p
              v-if="letter.senderName"
              class="text-[22pt] font-bold text-[#0f172a] leading-none tracking-tight"
            >
              {{ letter.senderName }}
            </p>
            <p
              v-if="letter.position"
              class="mt-2 text-[10pt] font-medium flex items-center gap-2"
              style="color: var(--color-secondary)"
            >
              <span
                class="inline-block w-5 h-px"
                style="background: currentColor"
              />
              {{ letter.position }}
            </p>
          </div>

          <!-- Date encadrée -->
          <div
            class="shrink-0 text-right border-t-2 pt-2 mt-1"
            style="border-color: var(--color-secondary)"
          >
            <p
              class="text-[8.5px] uppercase tracking-[0.15em] text-secondary font-bold opacity-70 mb-0.5"
            >
              Date
            </p>
            <p class="text-[9.5pt] text-[#475569] font-medium tabular-nums">
              {{ formattedDate }}
            </p>
          </div>
        </div>

        <!-- Coordonnées en tags -->
        <div v-if="senderLines.length > 1" class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="(line, i) in senderLines.slice(1)"
            :key="i"
            class="inline-flex items-center gap-1.5 text-[8.5px] px-2.5 py-1 rounded-full border text-[#475569]"
            style="
              border-color: color-mix(
                in srgb,
                var(--color-secondary) 30%,
                transparent
              );
              background: color-mix(
                in srgb,
                var(--color-secondary) 6%,
                transparent
              );
            "
          >
            {{ line }}
          </span>
        </div>
      </div>

      <!-- Destinataire -->
      <div v-if="recipientLines.length" class="mb-10 relative pl-4">
        <div
          class="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
          style="
            background: color-mix(
              in srgb,
              var(--color-secondary) 35%,
              transparent
            );
          "
        />
        <p
          class="text-[8px] uppercase tracking-[0.2em] font-bold mb-2 opacity-60"
          style="color: var(--color-secondary)"
        >
          Destinataire
        </p>
        <div class="text-[9.5pt] text-[#334155] space-y-px">
          <p class="font-semibold text-[#0f172a]">{{ recipientLines[0] }}</p>
          <p
            v-for="(line, i) in recipientLines.slice(1)"
            :key="i"
            class="leading-snug"
          >
            {{ line }}
          </p>
        </div>
      </div>

      <!-- Séparateur géométrique -->
      <div class="flex items-center gap-3 mb-8">
        <div
          class="h-px flex-1"
          style="
            background: color-mix(
              in srgb,
              var(--color-secondary) 20%,
              transparent
            );
          "
        />
        <div
          class="w-2 h-2 rotate-45"
          style="background: var(--color-secondary); opacity: 0.5"
        />
        <div
          class="h-px w-6"
          style="
            background: color-mix(
              in srgb,
              var(--color-secondary) 20%,
              transparent
            );
          "
        />
      </div>

      <!-- Salutation -->
      <p class="mb-6 font-semibold text-[#0f172a] text-[11pt]">
        {{ greeting }}
      </p>

      <!-- Corps : premier paragraphe mis en avant -->
      <div class="space-y-[1em] text-[#334155]">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          class="text-justify"
          :class="i === 0 ? 'text-[10.8pt] font-[450] text-[#1e293b]' : ''"
          style="hyphens: auto; -webkit-hyphens: auto; text-align-last: left"
        >
          {{ paragraph }}
        </p>
      </div>

      <!-- Formule de politesse -->
      <p class="mt-10 text-[10pt] text-[#475569] italic">{{ closing }}</p>

      <!-- Signature stylisée -->
      <div class="mt-6 flex items-end gap-4">
        <div
          class="h-[3px] w-12 rounded-full mb-1"
          style="
            background: linear-gradient(
              to right,
              var(--color-secondary),
              var(--color-primary)
            );
          "
        />
        <p
          v-if="letter.senderName"
          class="font-bold text-[13pt] tracking-tight leading-none"
          style="color: var(--color-secondary)"
        >
          {{ letter.senderName }}
        </p>
      </div>
    </div>
  </CoverLetterShell>
</template>
