<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const adminService = useAdminService()
const { formatDate, formatXof } = useAdminFormat()

const payment = ref<Record<string, unknown> | null>(null)
const saving = ref(false)
const message = ref('')
const status = ref('PAID')

async function load() {
  const result = await adminService.getPayment(String(route.params.id))
  payment.value = result.payment
  status.value = String(result.payment.status)
}

async function saveStatus() {
  saving.value = true
  try {
    const result = await adminService.updatePayment(String(route.params.id), { status: status.value })
    payment.value = result.payment
    message.value = 'Statut mis à jour.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="Détail paiement" subtitle="Consultation et mise à jour du statut.">
      <template #actions>
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="saveStatus">Mettre à jour</button>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard v-if="payment" padding="md" class="space-y-3">
      <p class="text-sm"><span class="text-on-surface-variant">Référence :</span> {{ payment.providerRef }}</p>
      <p class="text-sm"><span class="text-on-surface-variant">Montant :</span> {{ formatXof(Number(payment.amountXof)) }}</p>
      <p class="text-sm"><span class="text-on-surface-variant">Offre :</span> {{ payment.planSlug }}</p>
      <p class="text-sm"><span class="text-on-surface-variant">Créé :</span> {{ formatDate(String(payment.createdAt)) }}</p>
      <label class="block text-sm pt-2">
        <span class="font-semibold">Statut</span>
        <select v-model="status" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
          <option value="PENDING">En attente</option>
          <option value="PAID">Payé</option>
          <option value="FAILED">Échoué</option>
          <option value="CANCELED">Annulé</option>
        </select>
      </label>
    </UiCard>
  </div>
</template>
