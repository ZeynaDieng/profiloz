<script setup lang="ts">
const props = defineProps<{ status: string }>()

const classes = computed(() => {
  switch (props.status) {
    case 'premium':
    case 'PAID':
    case 'completed':
    case 'active':
    case 'PARSED':
      return 'bg-secondary/10 text-secondary'
    case 'FAILED':
    case 'failed':
    case 'error':
      return 'bg-error/10 text-error'
    case 'PENDING':
    case 'processing':
    case 'credits':
      return 'bg-tertiary/10 text-tertiary'
    default:
      return 'bg-surface-container text-on-surface-variant'
  }
})

const label = computed(() => {
  const map: Record<string, string> = {
    premium: 'Premium',
    credits: 'Crédits',
    free: 'Gratuit',
    PAID: 'Payé',
    PENDING: 'En attente',
    FAILED: 'Échoué',
    CANCELED: 'Annulé',
    completed: 'Terminé',
    pending: 'En attente',
    active: 'Actif',
    PARSED: 'Analysé',
    payment: 'Paiement',
    download: 'PDF',
    error: 'Erreur',
    ocr: 'OCR',
    connection: 'Connexion',
  }
  return map[props.status] ?? props.status
})
</script>

<template>
  <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="classes">{{ label }}</span>
</template>
