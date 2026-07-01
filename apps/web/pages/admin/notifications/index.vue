<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatDate } = useAdminFormat()

const title = ref('')
const body = ref('')
const audience = ref<'all' | 'business' | 'premium'>('all')
const sending = ref(false)
const message = ref('')
const history = ref<Record<string, unknown>[]>([])
const { fieldError, formError, clearAll, setFieldError, clearField, scrollToFirstError } = useFormValidation()

async function loadHistory() {
  try {
    const result = await adminService.listNotifications()
    history.value = result.data
  } catch {
    formError.value = 'Impossible de charger l’historique.'
  }
}

function validateNotificationForm(): boolean {
  clearAll()
  if (!title.value.trim()) {
    setFieldError('title', MSG.validation.required)
  }
  if (!body.value.trim()) {
    setFieldError('body', MSG.validation.required)
  }
  if (fieldError('title') || fieldError('body')) {
    formError.value = MSG.validation.invalidData
    scrollToFirstError()
    return false
  }
  return true
}

async function sendNotification() {
  if (!validateNotificationForm()) return

  sending.value = true
  message.value = ''
  try {
    const result = await adminService.sendNotification({
      title: title.value,
      body: body.value,
      audience: audience.value,
    })
    message.value = `Notification envoyée à ${result.notification.recipientCount} destinataire(s).`
    title.value = ''
    body.value = ''
    clearAll()
    await loadHistory()
  } catch {
    formError.value = 'Échec de l’envoi.'
  } finally {
    sending.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <div>
    <AdminPageHeader title="Notifications" subtitle="Annonces enregistrées et comptabilisées par audience." />

    <UiMessageBanner v-if="formError && !fieldError('title') && !fieldError('body')" variant="error" :message="formError" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
      <UiCard padding="lg">
        <form class="space-y-4" @submit.prevent="sendNotification">
          <UiFormField label="Audience">
            <select v-model="audience" class="form-input w-full text-sm">
              <option value="all">Tous les utilisateurs</option>
              <option value="business">Comptes Business uniquement</option>
              <option value="premium">Utilisateurs Premium</option>
            </select>
          </UiFormField>
          <UiFormField label="Titre" required :error="fieldError('title')">
            <input
              v-model="title"
              type="text"
              class="form-input w-full text-sm"
              @input="clearField('title')"
            >
          </UiFormField>
          <UiFormField label="Message" required :error="fieldError('body')">
            <textarea
              v-model="body"
              rows="5"
              class="form-input w-full text-sm resize-y"
              @input="clearField('body')"
            />
          </UiFormField>
          <UiButton type="submit" variant="secondary" icon="send" :loading="sending">
            Envoyer
          </UiButton>
        </form>
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
