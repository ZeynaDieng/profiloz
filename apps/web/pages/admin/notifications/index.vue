<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const title = ref('')
const body = ref('')
const audience = ref('all')
const sent = ref(false)

function sendNotification() {
  sent.value = true
}
</script>

<template>
  <div>
    <AdminPageHeader title="Notifications" subtitle="Envoyer une annonce aux utilisateurs." />

    <UiCard padding="lg" class="max-w-2xl">
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

        <UiButton variant="secondary" icon="send" disabled @click="sendNotification">
          Envoyer (bientôt disponible)
        </UiButton>

        <UiMessageBanner v-if="sent" variant="info" message="L’envoi de notifications push/in-app sera activé dans une prochaine version." />
      </div>
    </UiCard>
  </div>
</template>
