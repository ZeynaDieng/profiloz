<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const title = ref('')
const body = ref('')
const audience = ref<'all' | 'business' | 'premium'>('all')
const sending = ref(false)
const message = ref('')
const error = ref('')
const history = ref<Record<string, unknown>[]>([])

async function loadHistory() {
  try {
    const result = await adminService.listNotifications()
    history.value = result.data
  } catch {
    error.value = 'Impossible de charger l’historique.'
  }
}

async function sendNotification() {
  sending.value = true
  message.value = ''
  error.value = ''
  try {
    const result = await adminService.sendNotification({
      title: title.value,
      body: body.value,
      audience: audience.value,
    })
    message.value = `Notification envoyée à ${result.notification.recipientCount} destinataire(s).`
    title.value = ''
    body.value = ''
    await loadHistory()
  } catch {
    error.value = 'Échec de l’envoi.'
  } finally {
    sending.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <div>
    <AdminPageHeader title="Notifications" subtitle="Annonces enregistrées et comptabilisées par audience." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
      <UiCard padding="lg">
        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-on-surface">Audience</span>
            <select v-model="audience" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm">
              <option value="all">Tous les utilisateurs</option>
              <option value="business">Comptes Business uniquement</option>
              <option value="premium">Utilisateurs Premium</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-on-surface">Titre</span>
            <input v-model="title" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm">
          </label>
          <label class="block">
            <span class="text-sm font-medium text-on-surface">Message</span>
            <textarea v-model="body" rows="5" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" />
          </label>
          <UiButton variant="secondary" icon="send" :disabled="sending || !title.trim() || !body.trim()" @click="sendNotification">
            Envoyer
          </UiButton>
        </div>
      </UiCard>

      <UiCard padding="lg">
        <h3 class="font-semibold text-on-surface mb-3">Historique</h3>
        <ul v-if="history.length" class="space-y-3">
          <li v-for="item in history" :key="String(item.id)" class="text-sm border-b border-outline-variant/20 pb-3">
            <p class="font-medium text-on-surface">{{ item.title }}</p>
            <p class="text-on-surface-variant mt-1">{{ item.body }}</p>
            <p class="text-xs text-on-surface-variant mt-1">
              {{ item.audience }} · {{ item.recipientCount }} destinataire(s) · {{ formatDate(String(item.sentAt), true) }}
            </p>
          </li>
        </ul>
        <p v-else class="text-sm text-on-surface-variant">Aucune notification envoyée.</p>
      </UiCard>
    </div>
  </div>
</template>
