<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { DOCUMENT_TYPE_LABELS } from '~/utils/labels'
import { resolveDossierName } from '~/utils/dossierName'

definePageMeta({ layout: 'dashboard' })

interface LinkedLetter {
  id: string
  title: string
  companyName?: string | null
  position?: string | null
  templateId: string
  updatedAt: string
  resumeId?: string | null
}

interface DocItem {
  id: string
  type: string
  status: string
  originalName: string
  createdAt: string
}

const route = useRoute()
const authStore = useAuthStore()
const resumeService = useResumeService()
const coverLetterService = useCoverLetterService()
const documentService = useDocumentService()
const pdfService = usePdfService()

const dossierId = computed(() => String(route.params.id))

const snapshot = ref<ResumeSnapshot | null>(null)
const letters = ref<LinkedLetter[]>([])
const documents = ref<DocItem[]>([])
const loading = ref(true)
const error = ref('')
const cvDownloading = ref(false)
const dossierDownloading = ref(false)
const letterDownloadingId = ref<string | null>(null)
const renaming = ref(false)
const renameValue = ref('')
const renameSaving = ref(false)

const displayName = computed(() =>
  resolveDossierName({ fullName: snapshot.value?.personalInfo?.fullName, title: snapshot.value?.title }),
)

const jobTitle = computed(() => snapshot.value?.personalInfo?.jobTitle?.trim() || '')

const addLetterLink = computed(() => `/tableau-de-bord/lettres/nouvelle?resumeId=${dossierId.value}`)

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo({ path: '/connexion', query: { redirect: route.fullPath } })
    return
  }

  try {
    snapshot.value = await resumeService.getById(dossierId.value)
  } catch {
    error.value = 'Dossier introuvable.'
    loading.value = false
    return
  }

  // Les lettres et documents sont accessoires : on ne bloque pas le dossier s'ils échouent.
  try {
    const result = await coverLetterService.list()
    letters.value = (result.data as LinkedLetter[]).filter((l) => l.resumeId === dossierId.value)
  } catch {
    letters.value = []
  }

  try {
    const result = await documentService.listDocuments()
    documents.value = result.data as DocItem[]
  } catch {
    documents.value = []
  }

  loading.value = false
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onDownloadCv() {
  if (!snapshot.value) return
  cvDownloading.value = true
  error.value = ''
  try {
    await pdfService.downloadResumeCv(dossierId.value, snapshot.value)
  } catch (err) {
    const problem = err as { status?: number }
    if (problem?.status === 402) {
      await navigateTo(`/tarifs?resumeId=${dossierId.value}&reason=unlock`)
      return
    }
    error.value = MSG.pdf.error
  } finally {
    cvDownloading.value = false
  }
}

function startRename() {
  renameValue.value = snapshot.value?.title?.trim() || displayName.value
  renaming.value = true
}

function cancelRename() {
  renaming.value = false
}

async function onRename() {
  const title = renameValue.value.trim()
  if (!title || !snapshot.value) {
    renaming.value = false
    return
  }
  renameSaving.value = true
  error.value = ''
  try {
    await resumeService.rename(dossierId.value, title)
    snapshot.value = { ...snapshot.value, title }
    renaming.value = false
  } catch {
    error.value = MSG.error.renameFolder
  } finally {
    renameSaving.value = false
  }
}

async function onDownloadDossier() {
  if (!snapshot.value) return
  dossierDownloading.value = true
  error.value = ''
  try {
    await pdfService.downloadDossier(dossierId.value, snapshot.value)
  } catch (err) {
    const problem = err as { status?: number }
    if (problem?.status === 402) {
      // Paywall : aucun crédit → on dirige vers les offres pour débloquer ce dossier.
      await navigateTo(`/tarifs?resumeId=${dossierId.value}&reason=unlock`)
      return
    }
    error.value = MSG.error.generateDossier
  } finally {
    dossierDownloading.value = false
  }
}

async function onDownloadLetter(id: string) {
  letterDownloadingId.value = id
  error.value = ''
  try {
    await coverLetterService.downloadPdf(id)
  } catch (err) {
    const problem = err as { status?: number; detail?: string }
    if (problem?.status === 402) {
      await navigateTo(`/tarifs?resumeId=${dossierId.value}&reason=unlock`)
      return
    }
    error.value = problem.detail || MSG.pdf.error
  } finally {
    letterDownloadingId.value = null
  }
}
</script>

<template>
  <div class="page-container pb-28 lg:pb-0">
    <NuxtLink to="/tableau-de-bord" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-flex items-center gap-1 min-h-11">
      <UiPzIcon name="arrow_back" class="text-base" />
      Mes dossiers
    </NuxtLink>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-gutter">
      <UiSkeleton variant="card" />
      <UiSkeleton variant="rect" height="16rem" />
    </div>
    <UiMessageBanner v-else-if="error && !snapshot" variant="error" :message="error" class="mb-4" />

    <div v-else-if="snapshot">
      <!-- En-tête du dossier -->
      <div class="flex flex-col gap-4 mb-stack-lg">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Dossier de candidature</p>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              :class="letters.length ? 'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'"
            >
              <UiPzIcon :name="letters.length ? 'check_circle' : 'description'" class="text-[13px]" />
              {{ letters.length ? 'Prêt à envoyer' : 'CV seul' }}
            </span>
          </div>
          <div v-if="renaming" class="flex items-center gap-2 mt-1">
            <input
              v-model="renameValue"
              type="text"
              maxlength="200"
              placeholder="Nom du dossier"
              class="min-h-11 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-lg font-bold w-full max-w-sm"
              @keyup.enter="onRename"
              @keyup.esc="cancelRename"
            />
            <button
              type="button"
              class="min-h-11 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-60"
              :disabled="renameSaving || !renameValue.trim()"
              @click="onRename"
            >
              {{ renameSaving ? '…' : MSG.buttons.renameFolder }}
            </button>
            <button
              type="button"
              class="min-h-11 px-3 py-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
              @click="cancelRename"
            >
              Annuler
            </button>
          </div>
          <div v-else class="flex items-center gap-2 mt-1">
            <h1 class="text-2xl font-bold text-on-surface line-clamp-2">{{ displayName }}</h1>
            <button
              type="button"
              class="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
              aria-label="Renommer le dossier"
              title="Renommer le dossier"
              @click="startRename"
            >
              <UiPzIcon name="edit" class="text-[18px]" />
            </button>
          </div>
          <p v-if="jobTitle" class="text-on-surface-variant mt-1">{{ jobTitle }}</p>
        </div>
        <div class="hidden lg:flex flex-wrap gap-2 shrink-0">
          <NuxtLink
            :to="`/creer/editeur?id=${dossierId}`"
            class="btn-outline"
          >
            Modifier le CV
          </NuxtLink>
          <button
            v-if="letters.length"
            type="button"
            class="btn-outline disabled:opacity-60"
            :disabled="cvDownloading"
            @click="onDownloadCv"
          >
            {{ cvDownloading ? 'Préparation...' : 'CV seul' }}
          </button>
          <button
            type="button"
            class="btn-primary disabled:opacity-60"
            :disabled="dossierDownloading || cvDownloading"
            @click="letters.length ? onDownloadDossier() : onDownloadCv()"
          >
            <template v-if="letters.length">
              {{ dossierDownloading ? 'Préparation...' : 'Télécharger le dossier' }}
            </template>
            <template v-else>
              {{ cvDownloading ? 'Préparation...' : 'Télécharger le CV' }}
            </template>
          </button>
        </div>
      </div>

      <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-gutter items-start">
        <!-- CV -->
        <section class="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div class="relative bg-surface-container-low border-b border-outline-variant/20 aspect-[3/4] overflow-hidden">
            <FeatureTemplatesA4PreviewFit :resume="snapshot" />
          </div>
          <div class="p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant">CV</p>
            <p class="text-sm text-on-surface-variant mt-1">La pièce maîtresse de votre dossier.</p>
          </div>
        </section>

        <div class="space-y-gutter">
          <!-- Lettre de motivation -->
          <section class="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div class="flex items-center justify-between gap-3 mb-4">
              <h2 class="font-bold text-on-surface">
                Lettre de motivation
                <span v-if="letters.length" class="text-on-surface-variant font-semibold">({{ letters.length }})</span>
              </h2>
              <NuxtLink :to="addLetterLink" class="text-secondary text-sm font-bold hover:underline whitespace-nowrap">
                + Ajouter une lettre
              </NuxtLink>
            </div>

            <p v-if="!letters.length" class="text-sm text-on-surface-variant">
              {{ MSG.empty.noLetterInFolder }}
            </p>

            <ul v-else class="space-y-stack-md lg:divide-y lg:divide-outline-variant/30 lg:space-y-0">
              <li v-for="letter in letters" :key="letter.id" class="lg:py-3">
                <UiCard variant="glass" padding="md" class="lg:border-0 lg:bg-transparent lg:p-0 lg:rounded-none">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <p class="font-semibold text-on-surface truncate">{{ letter.title }}</p>
                      <p class="text-xs text-on-surface-variant truncate mt-0.5">
                        <span v-if="letter.position">{{ letter.position }}</span>
                        <span v-if="letter.position && letter.companyName"> · </span>
                        <span v-if="letter.companyName">{{ letter.companyName }}</span>
                        <span v-if="!letter.position && !letter.companyName">Mise à jour le {{ formatDate(letter.updatedAt) }}</span>
                      </p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1 shrink-0">
                      <UiButton
                        variant="outline"
                        size="sm"
                        block
                        :loading="letterDownloadingId === letter.id"
                        @click="onDownloadLetter(letter.id)"
                      >
                        PDF
                      </UiButton>
                      <NuxtLink :to="`/tableau-de-bord/lettres/${letter.id}`" class="contents">
                        <UiButton variant="secondary" size="sm" block>
                          Modifier
                        </UiButton>
                      </NuxtLink>
                    </div>
                  </div>
                </UiCard>
              </li>
            </ul>
          </section>

          <!-- Documents importés -->
          <section class="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div class="flex items-center justify-between gap-3 mb-2">
              <h2 class="font-bold text-on-surface">Documents importés</h2>
              <NuxtLink to="/tableau-de-bord/documents" class="text-secondary text-sm font-bold hover:underline whitespace-nowrap">
                Gérer
              </NuxtLink>
            </div>
            <p class="text-xs text-on-surface-variant mb-3">
              Vos documents importés sont partagés entre tous vos dossiers.
            </p>

            <p v-if="!documents.length" class="text-sm text-on-surface-variant">
              {{ MSG.empty.noDocumentInFolder }}
            </p>
            <ul v-else class="flex flex-wrap gap-2">
              <li
                v-for="doc in documents.slice(0, 6)"
                :key="doc.id"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface"
              >
                <UiPzIcon name="description" class="text-[18px] text-on-surface-variant" />
                <span class="truncate max-w-[180px]">{{ doc.originalName }}</span>
                <span class="text-xs text-on-surface-variant">{{ DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>

    <!-- Mobile : CTA principal sticky -->
    <UiStickyActionBar v-if="snapshot && !loading" class="lg:hidden">
      <div class="grid grid-cols-2 gap-2">
        <NuxtLink :to="`/creer/editeur?id=${dossierId}`" class="contents">
          <UiButton variant="outline" block icon="edit">
            Modifier
          </UiButton>
        </NuxtLink>
        <UiButton
          variant="secondary"
          block
          icon="download"
          :loading="dossierDownloading || cvDownloading"
          @click="letters.length ? onDownloadDossier() : onDownloadCv()"
        >
          {{ letters.length ? 'Dossier PDF' : 'CV PDF' }}
        </UiButton>
      </div>
    </UiStickyActionBar>
  </div>
</template>
