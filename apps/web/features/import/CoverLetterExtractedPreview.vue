<script setup lang="ts">
import type { CoverLetterImportData } from '@profiloz/shared'

defineProps<{
  data: CoverLetterImportData
}>()
</script>

<template>
  <div class="glass-card p-stack-lg rounded-xl space-y-stack-md">
    <p class="text-xs text-outline uppercase tracking-wider">Contenu extrait</p>

    <div v-if="data.senderName || data.senderEmail || data.senderPhone || data.senderLocation" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-if="data.senderName">
        <p class="text-xs text-on-surface-variant">Expéditeur</p>
        <p class="font-semibold text-on-surface">{{ data.senderName }}</p>
      </div>
      <div v-if="data.senderEmail">
        <p class="text-xs text-on-surface-variant">E-mail</p>
        <p class="text-on-surface">{{ data.senderEmail }}</p>
      </div>
      <div v-if="data.senderPhone">
        <p class="text-xs text-on-surface-variant">Téléphone</p>
        <p class="text-on-surface">{{ data.senderPhone }}</p>
      </div>
      <div v-if="data.senderLocation">
        <p class="text-xs text-on-surface-variant">Localisation</p>
        <p class="text-on-surface">{{ data.senderLocation }}</p>
      </div>
    </div>

    <div v-if="data.companyName || data.position || data.recruiterName" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-if="data.companyName">
        <p class="text-xs text-on-surface-variant">Entreprise</p>
        <p class="text-on-surface">{{ data.companyName }}</p>
      </div>
      <div v-if="data.position">
        <p class="text-xs text-on-surface-variant">Poste visé</p>
        <p class="text-on-surface">{{ data.position }}</p>
      </div>
      <div v-if="data.recruiterName">
        <p class="text-xs text-on-surface-variant">Destinataire</p>
        <p class="text-on-surface">{{ data.recruiterName }}</p>
      </div>
    </div>

    <div>
      <p class="text-xs text-on-surface-variant mb-2">Corps de la lettre</p>
      <div
        class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto rounded-lg bg-surface-container-low p-4 border border-outline-variant/20"
      >
        {{ data.content }}
      </div>
    </div>

    <div v-if="data.closingText">
      <p class="text-xs text-on-surface-variant mb-2">Formule de politesse</p>
      <p class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{{ data.closingText }}</p>
    </div>
  </div>
</template>
