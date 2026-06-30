<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const adminService = useAdminService()

const template = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')

const subject = ref('')
const bodyHtml = ref('')
const bodyText = ref('')

async function load() {
  loading.value = true
  try {
    const result = await adminService.getEmailTemplate(String(route.params.slug))
    template.value = result.template
    subject.value = String(result.template.subject ?? '')
    bodyHtml.value = String(result.template.bodyHtml ?? '')
    bodyText.value = String(result.template.bodyText ?? '')
  } catch {
    error.value = 'Template introuvable.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    const result = await adminService.updateEmailTemplate(String(route.params.slug), {
      subject: subject.value,
      bodyHtml: bodyHtml.value,
      bodyText: bodyText.value || null,
    })
    template.value = result.template
    message.value = 'Template enregistré.'
  } catch {
    message.value = 'Échec de l’enregistrement.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader
      v-if="template"
      :title="String(template.name)"
      :subtitle="String(template.slug)"
    >
      <template #actions>
        <NuxtLink to="/admin/emails" class="text-sm text-secondary font-semibold hover:underline">← Retour</NuxtLink>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard v-if="loading" padding="lg"><UiSkeleton variant="rect" height="16rem" /></UiCard>

    <UiCard v-else-if="template" padding="lg" class="max-w-3xl space-y-4">
      <label class="block">
        <span class="text-sm font-medium">Objet</span>
        <input v-model="subject" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm">
      </label>
      <label class="block">
        <span class="text-sm font-medium">Corps HTML</span>
        <textarea v-model="bodyHtml" rows="8" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-mono" />
      </label>
      <label class="block">
        <span class="text-sm font-medium">Corps texte</span>
        <textarea v-model="bodyText" rows="4" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" />
      </label>
      <UiButton variant="secondary" :disabled="saving" @click="save">Enregistrer</UiButton>
    </UiCard>
  </div>
</template>
