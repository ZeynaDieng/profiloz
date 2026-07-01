<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'admin' })

const adminService = useAdminService()

const settings = ref<Record<string, unknown> | null>(null)
const health = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const { fieldError, formError, clearAll, setFieldError, clearField, scrollToFirstError } = useFormValidation()

const appName = ref('')
const logoUrl = ref('')
const seoTitle = ref('')
const seoDescription = ref('')

async function load() {
  loading.value = true
  try {
    const [s, h] = await Promise.all([adminService.getSettings(), adminService.getHealth()])
    settings.value = s
    health.value = h
    appName.value = String((s.branding as { appName?: string })?.appName ?? '')
    logoUrl.value = String((s.branding as { logoUrl?: string })?.logoUrl ?? '')
    seoTitle.value = String((s.seo as { title?: string })?.title ?? '')
    seoDescription.value = String((s.seo as { description?: string })?.description ?? '')
  } catch {
    formError.value = 'Impossible de charger les paramètres.'
  } finally {
    loading.value = false
  }
}

async function save() {
  clearAll()
  if (!appName.value.trim()) {
    setFieldError('appName', MSG.validation.required)
    formError.value = MSG.validation.invalidData
    scrollToFirstError()
    return
  }

  saving.value = true
  message.value = ''
  try {
    settings.value = await adminService.updateSettings({
      branding: { appName: appName.value, logoUrl: logoUrl.value },
      seo: { title: seoTitle.value, description: seoDescription.value },
    })
    message.value = 'Paramètres enregistrés.'
  } catch {
    formError.value = 'Échec de l’enregistrement.'
  } finally {
    saving.value = false
  }
}

onMounted(load)

const paytechConfigured = computed(() => Boolean((settings.value?.paytech as { configured?: boolean })?.configured))
const smtpConfigured = computed(() => Boolean((settings.value?.smtp as { configured?: boolean })?.configured))
const aiConfigured = computed(() => Boolean((settings.value?.ai as { configured?: boolean })?.configured))
const storageProvider = computed(() => (settings.value?.storage as { provider?: string })?.provider ?? 'local')
const pdfReady = computed(() => Boolean((health.value?.pdfRender as { ready?: boolean })?.ready))
</script>

<template>
  <div>
    <AdminPageHeader title="Paramètres" subtitle="Identité, SEO et état des intégrations." />

    <UiMessageBanner v-if="formError && !fieldError('appName')" variant="error" :message="formError" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton variant="rect" height="10rem" />
    </div>

    <template v-else-if="settings">
      <UiMessageBanner variant="info" :message="String(settings.note)" class="mb-4" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-gutter">
        <UiCard padding="lg">
          <h3 class="font-bold text-on-surface mb-3">Identité</h3>
          <div class="space-y-3">
            <UiFormField label="Nom de l’application" required :error="fieldError('appName')">
              <input
                v-model="appName"
                type="text"
                class="form-input w-full"
                @input="clearField('appName')"
              >
            </UiFormField>
            <UiFormField label="URL du logo">
              <input v-model="logoUrl" type="text" class="form-input w-full">
            </UiFormField>
          </div>
        </UiCard>

        <UiCard padding="lg">
          <h3 class="font-bold text-on-surface mb-3">SEO</h3>
          <div class="space-y-3">
            <UiFormField label="Titre">
              <input v-model="seoTitle" type="text" class="form-input w-full">
            </UiFormField>
            <UiFormField label="Description">
              <textarea v-model="seoDescription" rows="3" class="form-input w-full resize-y" />
            </UiFormField>
          </div>
        </UiCard>

        <UiCard padding="lg" class="lg:col-span-2">
          <h3 class="font-bold text-on-surface mb-3">Intégrations (lecture seule)</h3>
          <ul class="space-y-2 text-sm">
            <li class="flex justify-between gap-2"><span>PayTech</span><AdminStatusBadge :status="paytechConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>SMTP</span><AdminStatusBadge :status="smtpConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>IA</span><AdminStatusBadge :status="aiConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>Stockage</span><AdminStatusBadge :status="storageProvider !== 'local' ? 'active' : 'pending'" /></li>
            <li class="flex justify-between gap-2"><span>PDF</span><AdminStatusBadge :status="pdfReady ? 'active' : 'FAILED'" /></li>
          </ul>
        </UiCard>
      </div>

      <UiButton variant="secondary" :disabled="saving" @click="save">Enregistrer les paramètres</UiButton>
    </template>
  </div>
</template>
