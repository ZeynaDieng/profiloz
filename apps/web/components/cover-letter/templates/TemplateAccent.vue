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

// Initiales du candidat pour l'avatar décoratif
const initials = computed(() => {
  if (!props.letter.senderName) return "";
  return props.letter.senderName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});
</script>

<template>
  <CoverLetterShell template-name="Accent">
    <div class="font-sans text-[10.5pt] leading-[1.7] text-[#1e293b]">
      <!-- En-tête avec dégradé et avatar -->
      <div
        class="relative -mx-[20mm] px-[20mm] py-8 mb-10 overflow-hidden"
        style="
          background: linear-gradient(
            135deg,
            var(--color-secondary) 0%,
            color-mix(in srgb, var(--color-secondary) 80%, #000) 100%
          );
        "
      >
        <!-- Cercle décoratif de fond -->
        <div
          class="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style="background: white"
        />

        <div class="relative flex items-start gap-5">
          <!-- Avatar initiales -->
          <div
            v-if="initials"
            class="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-base tracking-wide"
          >
            {{ initials }}
          </div>

          <div class="flex-1 min-w-0">
            <p
              v-if="letter.senderName"
              class="text-white text-lg font-bold leading-tight"
            >
              {{ letter.senderName }}
            </p>
            <p
              v-if="letter.position"
              class="text-white/80 text-[10px] uppercase tracking-[0.12em] font-medium mt-1"
            >
              Candidature · {{ letter.position }}
            </p>
          </div>

          <p class="flex-shrink-0 text-white/60 text-[9.5px] mt-1 tabular-nums">
            {{ formattedDate }}
          </p>
        </div>

        <!-- Séparateur décoratif bas -->
        <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10" />
      </div>

      <!-- Bloc expéditeur / destinataire -->
      <div class="grid grid-cols-[1fr_2fr] gap-8 mb-10 text-[9.5pt]">
        <div
          v-if="senderLines.length > 1"
          class="pl-3 border-l-2 space-y-0.5 text-[#475569]"
          style="border-color: var(--color-secondary)"
        >
          <p
            class="text-[8.5px] uppercase tracking-[0.14em] font-bold mb-2"
            style="color: var(--color-secondary)"
          >
            Expéditeur
          </p>
          <p
            v-for="(line, i) in senderLines.slice(1)"
            :key="i"
            class="leading-snug"
          >
            {{ line }}
          </p>
        </div>

        <div
          v-if="recipientLines.length"
          class="pl-3 border-l-2 space-y-0.5 text-[#475569]"
          style="
            border-color: color-mix(
              in srgb,
              var(--color-secondary) 40%,
              transparent
            );
          "
        >
          <p
            class="text-[8.5px] uppercase tracking-[0.14em] font-bold mb-2"
            style="color: var(--color-secondary)"
          >
            Destinataire
          </p>
          <p v-for="(line, i) in recipientLines" :key="i" class="leading-snug">
            {{ line }}
          </p>
        </div>
      </div>

      <!-- Séparateur avant le corps -->
      <div class="flex items-center gap-3 mb-6">
        <div class="h-px flex-1 bg-[#e2e8f0]" />
        <div
          class="w-1.5 h-1.5 rounded-full"
          style="background: var(--color-secondary); opacity: 0.4"
        />
        <div class="h-px flex-1 bg-[#e2e8f0]" />
      </div>

      <!-- Salutation -->
      <p class="mb-6 font-semibold text-[#0f172a] text-[10.5pt]">
        {{ greeting }}
      </p>

      <!-- Paragraphes -->
      <div class="space-y-[1.1em] text-[#334155]">
        <p
          v-for="(paragraph, i) in paragraphs"
          :key="i"
          class="text-justify hyphens-auto"
          style="text-align-last: left"
        >
          {{ paragraph }}
        </p>
      </div>

      <!-- Formule de politesse -->
      <div class="mt-10 pt-6 border-t border-[#e2e8f0]">
        <p class="text-[10pt] text-[#334155]">{{ closing }}</p>
      </div>
    </div>
  </CoverLetterShell>
</template>

<style scoped>
:deep(.letter-a4) {
  padding-top: 0;
}

/* Trait de justification pour texte justifié propre */
:deep(p) {
  -webkit-hyphens: auto;
  hyphens: auto;
}
</style>
