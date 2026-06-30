<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, formatFileSize } from '~/utils/labels'

interface DocumentItem {
  id: string
  type: string
  status: string
  originalName: string
  sizeBytes: number
  createdAt: string
}

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const documentService = useDocumentService()
const paymentService = usePaymentService()
const { confirm } = useConfirm()

const documents = ref<DocumentItem[]>([])
const loading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)

async function loadDocuments() {
  loading.value = true
  error.value = ''
  try {
    const result = await documentService.listDocuments()
    documents.value = result.data
  } catch {
    error.value = MSG.error.loadDocuments
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const entitlements = await paymentService.getEntitlements()
    if (!entitlements.features.historique) {
      await navigateTo({
        path: '/tarifs',
        query: { reason: 'historique', returnTo: '/tableau-de-bord/documents' },
      })
      return
    }
  } catch {
    await navigateTo('/tarifs')
    return
  }

  await loadDocuments()
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusClass(status: string) {
  if (status === 'PARSED') return 'bg-secondary/10 text-secondary'
  if (status === 'PROCESSING') return 'bg-primary/10 text-primary'
  if (status === 'FAILED') return 'bg-error/10 text-error'
  return 'bg-surface-container text-on-surface-variant'
}

async function deleteDocument(id: string) {
  const ok = await confirm(MSG.delete.confirmDocument, {
    title: MSG.delete.title,
    confirmLabel: MSG.delete.confirmLabel,
    destructive: true,
  })
  if (!ok) return
  deletingId.value = id
  try {
    await documentService.remove(id)
    documents.value = documents.value.filter((d) => d.id !== id)
  } catch {
    error.value = MSG.delete.error
  } finally {
    deletingId.value = null
  }
}

const importLinks = [
  { to: '/creer/importer/cv', label: 'Importer un CV', icon: 'description', desc: 'Import & scan automatique' },
  { to: '/creer/importer/lettre', label: 'Importer une lettre', icon: 'mail', desc: 'Préremplissage instantané' },
]
</script>

<template>
  <div class="page-container">
    <header class="mb-stack-lg">
      <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Mes documents</h1>
      <p class="text-on-surface-variant mt-1">Historique de vos imports et fichiers analysés.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-stack-md mb-stack-lg">
      <NuxtLink
        v-for="link in importLinks"
        :key="link.to"
        :to="link.to"
        class="bento-card rounded-xl p-stack-md border border-outline-variant hover:border-secondary transition-colors flex items-center gap-4 min-h-[72px]"
      >
        <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
          <UiPzIcon :name="link.icon" />
        </div>
        <div class="min-w-0">
          <span class="font-semibold text-on-surface block">{{ link.label }}</span>
          <span class="text-xs text-on-surface-variant">{{ link.desc }}</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Skeleton loaders -->
    <div v-if="loading" class="space-y-stack-md">
      <UiSkeleton v-for="i in 3" :key="i" variant="rect" height="5.5rem" />
    </div>

    <UiMessageBanner v-else-if="error" variant="error" :message="error" class="mb-4" />

    <UiCard v-else-if="documents.length === 0" variant="glass" padding="lg" class="text-center">
      <UiPzIcon name="folder_open" class="text-4xl text-on-surface-variant/40 mb-3" />
      <h2 class="font-bold text-on-surface mb-2">{{ MSG.empty.noDocument }}</h2>
      <p class="text-on-surface-variant mb-4">Importez un CV ou une lettre de motivation pour commencer.</p>
      <NuxtLink to="/creer/importer/cv">
        <UiButton variant="secondary" icon="upload_file">Importer un CV</UiButton>
      </NuxtLink>
    </UiCard>

    <!-- Mobile & tablette : cartes -->
    <div v-else class="space-y-stack-md xl:hidden">
      <DashboardDocumentCard
        v-for="doc in documents"
        :key="doc.id"
        :doc="doc"
        :deleting="deletingId === doc.id"
        @delete="deleteDocument(doc.id)"
      />
    </div>

    <!-- Desktop : tableau -->
    <div v-if="!loading && documents.length" class="hidden xl:block glass-card rounded-xl border border-outline-variant overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container-low text-left text-on-surface-variant">
          <tr>
            <th class="px-4 py-3 font-semibold">Fichier</th>
            <th class="px-4 py-3 font-semibold">Type</th>
            <th class="px-4 py-3 font-semibold">Taille</th>
            <th class="px-4 py-3 font-semibold">Statut</th>
            <th class="px-4 py-3 font-semibold">Date</th>
            <th class="px-4 py-3 font-semibold w-16" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" class="border-t border-outline-variant/50">
            <td class="px-4 py-3 font-medium text-on-surface">{{ doc.originalName }}</td>
            <td class="px-4 py-3 text-on-surface-variant">
              {{ DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type }}
            </td>
            <td class="px-4 py-3 text-on-surface-variant">{{ formatFileSize(doc.sizeBytes) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="statusClass(doc.status)">
                {{ DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-on-surface-variant">{{ formatDate(doc.createdAt) }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="touch-target inline-flex items-center justify-center text-error hover:bg-error/5 rounded-lg disabled:opacity-50"
                :disabled="deletingId === doc.id"
                title="Supprimer"
                @click="deleteDocument(doc.id)"
              >
                <UiPzIcon name="delete" class="text-base" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
