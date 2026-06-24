<script setup lang="ts">
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
    error.value = 'Impossible de charger vos documents.'
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
  if (!confirm('Supprimer ce document ?')) return
  deletingId.value = id
  try {
    await documentService.remove(id)
    documents.value = documents.value.filter((d) => d.id !== id)
  } catch {
    error.value = 'Impossible de supprimer ce document.'
  } finally {
    deletingId.value = null
  }
}

const importLinks = [
  { to: '/creer/importer/cv', label: 'Importer un CV', icon: 'upload_file' },
  { to: '/creer/importer/diplome', label: 'Importer un diplôme', icon: 'school' },
  { to: '/creer/importer/attestation', label: 'Importer une attestation', icon: 'verified' },
]
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="flex justify-between items-end mb-stack-lg">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Mes documents</h1>
        <p class="text-on-surface-variant">Historique de vos imports et fichiers analysés.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
      <NuxtLink
        v-for="link in importLinks"
        :key="link.to"
        :to="link.to"
        class="glass-card rounded-xl p-stack-md border border-outline-variant hover:border-secondary transition-colors flex items-center gap-3"
      >
        <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
          <UiPzIcon :name="link.icon" />
        </div>
        <span class="font-semibold text-on-surface">{{ link.label }}</span>
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement...</p>
    <p v-else-if="error" class="text-error mb-4">{{ error }}</p>

    <div v-else-if="documents.length === 0" class="glass-card rounded-xl p-stack-lg border border-outline-variant text-center">
      <UiPzIcon name="folder_open" class="text-4xl text-on-surface-variant/40 mb-3" />
      <h2 class="font-bold text-on-surface mb-2">Aucun document</h2>
      <p class="text-on-surface-variant mb-4">Importez un CV, un diplôme ou une attestation pour commencer.</p>
      <NuxtLink to="/creer/importer/cv" class="text-secondary font-bold hover:underline">Importer un CV</NuxtLink>
    </div>

    <div v-else class="glass-card rounded-xl border border-outline-variant overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container-low text-left text-on-surface-variant">
          <tr>
            <th class="px-4 py-3 font-semibold">Fichier</th>
            <th class="px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
            <th class="px-4 py-3 font-semibold hidden md:table-cell">Taille</th>
            <th class="px-4 py-3 font-semibold">Statut</th>
            <th class="px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
            <th class="px-4 py-3 font-semibold w-16" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" class="border-t border-outline-variant/50">
            <td class="px-4 py-3 font-medium text-on-surface">{{ doc.originalName }}</td>
            <td class="px-4 py-3 hidden sm:table-cell text-on-surface-variant">
              {{ DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type }}
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-on-surface-variant">{{ formatFileSize(doc.sizeBytes) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="statusClass(doc.status)">
                {{ DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status }}
              </span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell text-on-surface-variant">{{ formatDate(doc.createdAt) }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="p-2 text-error hover:bg-error/5 rounded-lg disabled:opacity-50"
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
