<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { summarizeEntitlements } from '~/utils/entitlements-summary'
import {
  ensurePaidGuestDossier,
  isGuestDossierComplete,
  loadGuestDossierState,
  nextIncludedDocument,
  reconcileGuestDossierFlags,
  syncGuestDossierFromDownloads,
  type GuestDossierState,
} from '~/utils/guest-dossier-state'
import { loadLastDownloadContext } from '~/utils/last-download-context'
import {
  classifyPurchaseAudience,
  isWalletOffer,
} from '~/utils/payment-journey'
import { peekLastPurchasedPlan } from '~/utils/payment-purchase'
import { clearPaymentDraftBackup } from '~/utils/payment-draft-backup'
import { buildResumePdfFilename } from '~/utils/resumePdfFilename'
import { buildCoverLetterPdfFilename } from '~/utils/coverLetterPdfFilename'

definePageMeta({ layout: 'guest-flow' })

useSeoPage({ title: 'Votre document est prêt', noindex: true })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const paymentService = usePaymentService()
const { downloading, downloadError, lastFilename, downloadKind } = useGuestDownload()

const isLetter = computed(() => route.query.type === 'letter')
const signupRedirect = '/tableau-de-bord?welcome=1'
const dossierState = ref<GuestDossierState | null>(null)
const copiedName = ref(false)
const isHelpOpen = ref(false)
const isPreviewModalOpen = ref(false)

const purchasedPlan = computed(() => peekLastPurchasedPlan())
const purchaseAudience = computed(() =>
  classifyPurchaseAudience(purchasedPlan.value, entitlements.value),
)
const isWalletPurchase = computed(() => isWalletOffer(purchaseAudience.value))

const currentResumeSnapshot = computed(() => {
  if (resumeStore.current) {
    return {
      ...resumeStore.current,
      templateConfig: { ...resumeStore.current.templateConfig },
    }
  }
  const serverDraft = entitlements.value?.paidDraftSnapshot
  if (serverDraft && typeof serverDraft === 'object') {
    const snap = serverDraft as any
    if (snap?.personalInfo || snap?.experiences?.length || snap?.skills?.length) {
      return snap
    }
  }
  const backup = loadPaymentDraftBackup()
  if (backup?.kind === 'resume' && backup.snapshot) {
    return backup.snapshot
  }
  const fromStorage = findResumeSnapshotInStorage()
  if (fromStorage) {
    return fromStorage
  }
  return null
})

const currentLetterSnapshot = computed(() => {
  if (coverLetterStore.current) {
    return coverLetterStore.toSnapshot()
  }
  const serverDraft = entitlements.value?.paidDraftSnapshot
  if (serverDraft && typeof serverDraft === 'object') {
    const draft = serverDraft as any
    if (draft?.content || draft?.senderName) {
      return {
        id: draft.id || 'letter-1',
        templateSlug: draft.templateSlug || 'CLASSIQUE',
        senderName: draft.senderName || '',
        recipientName: draft.recipientName || '',
        jobTitle: draft.jobTitle || '',
        companyName: draft.companyName || '',
        content: draft.content || '',
        accentColor: draft.accentColor,
        fontSize: draft.fontSize || 'medium',
      }
    }
  }
  const backup = loadPaymentDraftBackup()
  if (backup?.kind === 'letter' && backup.draft) {
    return {
      id: backup.draft.id || 'letter-1',
      templateSlug: backup.draft.templateSlug || 'CLASSIQUE',
      senderName: backup.draft.senderName || '',
      recipientName: backup.draft.recipientName || '',
      jobTitle: backup.draft.jobTitle || '',
      companyName: backup.draft.companyName || '',
      content: backup.draft.content || '',
      accentColor: backup.draft.accentColor,
      fontSize: backup.draft.fontSize || 'medium',
    }
  }
  const fromStorage = findCoverLetterDraftInStorage()
  if (fromStorage) {
    return {
      id: fromStorage.id || 'letter-1',
      templateSlug: fromStorage.templateSlug || 'CLASSIQUE',
      senderName: fromStorage.senderName || '',
      recipientName: fromStorage.recipientName || '',
      jobTitle: fromStorage.jobTitle || '',
      companyName: fromStorage.companyName || '',
      content: fromStorage.content || '',
      accentColor: fromStorage.accentColor,
      fontSize: fromStorage.fontSize || 'medium',
    }
  }
  return null
})

const downloadedFilename = computed(() => {
  const fromQuery = route.query.file
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery
  if (lastFilename.value) return lastFilename.value
  const last = loadLastDownloadContext()
  if (last?.filename) return last.filename
  if (isLetter.value && coverLetterStore.current) {
    return buildCoverLetterPdfFilename(coverLetterStore.current.senderName)
  }
  if (resumeStore.current) return buildResumePdfFilename(resumeStore.current)
  return isLetter.value ? 'lettre-profiloz.pdf' : 'cv-profiloz.pdf'
})

const docTitle = computed(() => (isLetter.value ? 'Votre lettre est prête !' : 'Votre CV est prêt !'))
const docTypeName = computed(() => (isLetter.value ? 'lettre' : 'CV'))
const docTypeNameUpper = computed(() => (isLetter.value ? 'Lettre' : 'CV'))

const dossierComplete = computed(() => isGuestDossierComplete(dossierState.value))
const nextDocument = computed(() => nextIncludedDocument(dossierState.value))

const hasPaidSession = computed(
  () =>
    hasPaidAccess.value
    || Boolean(dossierState.value?.paidAt)
    || (typeof route.query.file === 'string' && Boolean(route.query.file.trim())),
)

const showCrossSell = computed(() => Boolean(nextDocument.value) && hasPaidSession.value)

const crossSellLink = computed(() => {
  if (nextDocument.value === 'letter') return '/creer/lettre/modele'
  if (nextDocument.value === 'cv') return '/creer/modele'
  return isLetter.value ? '/creer/modele' : '/creer/lettre/modele'
})

const crossSellTitle = computed(() => {
  if (nextDocument.value === 'letter') return 'Bonus inclus dans votre offre'
  if (nextDocument.value === 'cv') return 'Bonus inclus dans votre offre'
  return 'Bonus inclus dans votre offre'
})

const crossSellBody = computed(() => {
  if (nextDocument.value === 'letter') return 'Votre dossier comprend également une lettre de motivation personnalisée, prête à être envoyée.'
  if (nextDocument.value === 'cv') return 'Votre dossier comprend également la création d’un 2ème CV personnalisé.'
  return 'Votre dossier comprend également une lettre de motivation personnalisée.'
})

const crossSellCta = computed(() => {
  if (nextDocument.value === 'letter') return 'Créer ma lettre incluse'
  if (nextDocument.value === 'cv') return 'Créer mon 2ème CV inclus'
  return isLetter.value ? 'Créer mon CV inclus' : 'Créer ma lettre incluse'
})

const hasPaidAccess = ref(false)
const entitlements = ref<import('~/services/payment.service').Entitlements | null>(null)
const entitlementsSummary = computed(() => summarizeEntitlements(entitlements.value))
const showWalletStatus = computed(() => isWalletPurchase.value && entitlementsSummary.value)

async function refreshEntitlements() {
  try {
    await useGuestSession().ensureSession()
    await syncGuestSessionForEditor()
    entitlements.value = await paymentService.getEntitlements()
    hasPaidAccess.value = hasDossierDownloadAccess(entitlements.value)
  } catch {
    entitlements.value = null
    hasPaidAccess.value = false
  }
}

async function triggerDownload() {
  await downloadKind(isLetter.value ? 'letter' : 'cv')
  dossierState.value = loadGuestDossierState()
  await refreshEntitlements()
}

function startSecondCv() {
  resumeStore.startNewDraft()
  clearPaymentDraftBackup()
  navigateTo('/creer/modele')
}

function startSecondLetter() {
  coverLetterStore.current = null
  clearPaymentDraftBackup()
  navigateTo('/creer/lettre/modele')
}

async function copyFilename() {
  if (import.meta.client && downloadedFilename.value) {
    try {
      await navigator.clipboard.writeText(downloadedFilename.value)
      copiedName.value = true
      setTimeout(() => {
        copiedName.value = false
      }, 2500)
    } catch {
      // fallback
    }
  }
}

onMounted(async () => {
  authStore.loadFromStorage()
  resumeStore.rehydrateFromStorage()
  coverLetterStore.rehydrateFromStorage()
  const hasLetterContent = Boolean(coverLetterStore.current?.content?.trim())
  dossierState.value =
    reconcileGuestDossierFlags(hasLetterContent)
    ?? syncGuestDossierFromDownloads()
    ?? loadGuestDossierState()

  const container = document.getElementById('confetti-container')
  if (container) {
    const colors = ['#316bf3', '#10b981', '#6366f1', '#f59e0b']
    for (let i = 0; i < 35; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)] ?? '#316bf3'
      el.style.animationDelay = `${Math.random() * 2.5}s`
      container.appendChild(el)
    }
  }

  try {
    await refreshEntitlements()
  } catch {
    hasPaidAccess.value = false
  }

  if (!dossierState.value && hasPaidAccess.value) {
    const lastKind = loadLastDownloadContext()?.kind ?? (isLetter.value ? 'letter' : 'cv')
    dossierState.value = ensurePaidGuestDossier(lastKind) ?? loadGuestDossierState()
  }

  dossierState.value = syncGuestDossierFromDownloads() ?? dossierState.value

  const jobId = typeof route.query.jobId === 'string' ? route.query.jobId : null
  const file = typeof route.query.file === 'string' ? route.query.file : null
  if (jobId && file) {
    setTimeout(() => {
      const downloadUrl = `/api/v1/pdf/download/${jobId}`
      const pdfService = usePdfService()
      pdfService.downloadWithAuth(downloadUrl, file).catch((err) => {
        console.error('Erreur lors du téléchargement automatique:', err)
      })
    }, 1500)

    const router = useRouter()
    const query = { ...route.query }
    delete query.jobId
    delete query.file
    router.replace({ query })
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-x-hidden pb-24">
    <!-- Confetti container -->
    <div id="confetti-container" class="fixed inset-0 pointer-events-none overflow-hidden z-0" />

    <!-- Container principal -->
    <div class="relative z-10 w-full max-w-4xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
      
      <!-- Stepper Desktop -->
      <div class="hidden md:flex items-center justify-center gap-12 mb-8 w-full max-w-xl">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ✓
          </div>
          <span class="text-xs font-semibold text-slate-700">1. Informations</span>
        </div>
        <div class="h-0.5 flex-1 bg-emerald-500 rounded-full" />
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ✓
          </div>
          <span class="text-xs font-semibold text-slate-700">2. Génération</span>
        </div>
        <div class="h-0.5 flex-1 bg-blue-600 rounded-full" />
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-blue-100">
            3
          </div>
          <span class="text-xs font-bold text-blue-900">3. Télécharger</span>
        </div>
      </div>

      <!-- Stepper Mobile -->
      <div class="md:hidden flex items-center justify-between w-full mb-6 px-1">
        <span class="text-xs font-bold text-slate-600">Étape 3 sur 3</span>
        <div class="flex-1 mx-3 flex gap-1.5 h-1.5">
          <div class="flex-1 bg-emerald-500 rounded-full" />
          <div class="flex-1 bg-emerald-500 rounded-full" />
          <div class="flex-1 bg-blue-600 rounded-full" />
        </div>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
          ✓ 100 %
        </span>
      </div>

      <!-- Carte blanche principale -->
      <div class="w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-10 flex flex-col items-center text-center">
        
        <!-- En-tête Félicitations -->
        <div class="text-5xl mb-3 animate-bounce">🎉</div>
        <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {{ docTitle }}
        </h1>
        <p class="text-slate-600 text-sm md:text-base max-w-lg mb-4">
          Téléchargez-le maintenant pour commencer vos candidatures.
        </p>

        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-6">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          100% terminé
        </span>

        <!-- Aperçu Vignette Document (Carte interactive) -->
        <div class="relative group my-2 w-full max-w-sm flex flex-col items-center">
          <div class="relative w-[260px] h-[368px] min-h-[350px] bg-slate-100 rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
            <FeaturesTemplatesA4PreviewFit
              v-if="!isLetter && currentResumeSnapshot"
              :resume="currentResumeSnapshot"
            />
            <FeaturesCoverLetterTemplatesA4PreviewFit
              v-else-if="isLetter && currentLetterSnapshot"
              :letter="currentLetterSnapshot"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400">
              <UiPzIcon name="description" class="text-5xl mb-2 text-slate-300" />
              <span class="text-xs font-medium text-slate-500">Document généré en HD</span>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
            @click="isPreviewModalOpen = true"
          >
            <UiPzIcon name="visibility" class="text-sm" />
            <span class="hidden md:inline">Aperçu du {{ docTypeNameUpper }}</span>
            <span class="md:hidden">Voir l'aperçu en grand</span>
          </button>
        </div>

        <!-- Message d'erreur de téléchargement -->
        <UiMessageBanner
          v-if="downloadError"
          variant="error"
          :message="downloadError"
          class="w-full mt-4 mb-2 text-left"
        />

        <!-- Grand bouton bleu de Téléchargement -->
        <button
          type="button"
          class="w-full max-w-xl mt-6 group relative flex items-center justify-between p-4 md:p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
          :disabled="downloading"
          @click="triggerDownload"
        >
          <div class="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <UiPzIcon
              v-if="!downloading"
              name="download"
              class="text-2xl text-white group-hover:translate-y-0.5 transition-transform"
            />
            <span v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>

          <div class="flex-1 text-center px-4">
            <div class="text-lg md:text-xl font-extrabold leading-tight">
              Télécharger mon {{ docTypeNameUpper }}
            </div>
            <div class="text-xs md:text-sm text-blue-100 font-normal mt-0.5">
              Format PDF – Téléchargement instantané
            </div>
          </div>

          <div class="hidden sm:flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/20 text-xs font-black uppercase tracking-wider shrink-0">
            PDF
          </div>
        </button>

        <!-- Rangée 3 Avantages / Réassurance -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-xl mt-8 pt-6 border-t border-slate-100">
          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              ⚡
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-bold text-slate-800">Téléchargement instantané</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Votre fichier PDF est prêt et disponible immédiatement.</div>
            </div>
          </div>

          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              🛡️
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-bold text-slate-800">Optimisé pour les recruteurs</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Mise en page professionnelle compatible ATS.</div>
            </div>
          </div>

          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              📱
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-bold text-slate-800">Compatible partout</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Fonctionne sur LinkedIn, Indeed, France Travail, etc.</div>
            </div>
          </div>
        </div>

        <!-- Encadré Vert : Bonus Inclus (Lettre ou 2ème CV) -->
        <div
          v-if="showCrossSell"
          class="w-full max-w-xl mt-6 p-4 md:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
        >
          <div class="flex items-start gap-3 min-w-0">
            <div class="text-3xl shrink-0">🎁</div>
            <div class="min-w-0">
              <div class="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                {{ crossSellTitle }}
              </div>
              <p class="text-xs text-emerald-800 mt-1 leading-relaxed">
                {{ crossSellBody }}
              </p>
            </div>
          </div>

          <NuxtLink :to="crossSellLink" class="shrink-0 w-full sm:w-auto">
            <button
              type="button"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{{ crossSellCta }}</span>
              <span>→</span>
            </button>
          </NuxtLink>
        </div>

        <!-- Boîte Nom du fichier + Copier -->
        <div class="w-full max-w-xl mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 min-w-0 text-slate-700 font-medium">
            <UiPzIcon name="description" class="text-base text-slate-400 shrink-0" />
            <span class="truncate">Nom du fichier : <strong>{{ downloadedFilename }}</strong></span>
          </div>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold shrink-0 transition-colors flex items-center gap-1.5"
            @click="copyFilename"
          >
            <span>{{ copiedName ? 'Copié ! ✓' : 'Copier le nom' }}</span>
            <UiPzIcon name="content_copy" class="text-sm text-slate-400" />
          </button>
        </div>

        <!-- Accordéon d'aide au téléchargement -->
        <div class="w-full max-w-xl mt-4 rounded-xl bg-blue-50/50 border border-blue-100 overflow-hidden text-left transition-all">
          <button
            type="button"
            class="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-blue-100/50 transition-colors"
            @click="isHelpOpen = !isHelpOpen"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                ?
              </div>
              <div>
                <div class="font-bold text-blue-950">Besoin d'aide pour retrouver votre téléchargement ?</div>
                <div class="text-[11px] text-slate-500 font-normal mt-0.5">Consultez nos instructions pour iPhone, Android et ordinateur.</div>
              </div>
            </div>
            <UiPzIcon
              name="expand_more"
              class="text-lg text-slate-500 transition-transform duration-200"
              :class="isHelpOpen && 'rotate-180'"
            />
          </button>

          <div v-if="isHelpOpen" class="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-blue-100/60 space-y-2.5">
            <div class="flex items-start gap-2">
              <span class="font-bold text-slate-800 shrink-0">📱 iPhone :</span>
              <span>Ouvrez l'application <strong>Fichiers</strong> ➔ <em>Téléchargements</em> (ou touchez l'icône <span class="text-blue-600">↓</span> dans la barre d'adresse de Safari).</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="font-bold text-slate-800 shrink-0">🤖 Android :</span>
              <span>Glissez le panneau de notifications vers le bas ou ouvrez l'application <strong>Mes Fichiers</strong> ➔ <em>Téléchargements</em>.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="font-bold text-slate-800 shrink-0">💻 Ordi :</span>
              <span>Vérifiez le dossier <strong>Téléchargements</strong> de votre navigateur (raccourci `Ctrl + J` sur Windows ou `Cmd + Option + L` sur Mac).</span>
            </div>
          </div>
        </div>

        <!-- Pied de page : Retour à l'accueil -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-1">
          <NuxtLink
            to="/"
            class="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 hover:underline"
          >
            <span>🏠</span>
            <span>Retourner à l'accueil</span>
          </NuxtLink>
          <span class="text-xs text-slate-400">Explorer les autres modèles & services du site</span>
        </div>

      </div>
    </div>

    <!-- Modal d'aperçu en grand HD -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isPreviewModalOpen"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          @click.self="isPreviewModalOpen = false"
        >
          <div class="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="px-5 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800">
                Aperçu HD — {{ downloadedFilename }}
              </h3>
              <button
                type="button"
                class="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                @click="isPreviewModalOpen = false"
              >
                <UiPzIcon name="close" class="text-lg" />
              </button>
            </div>
            <div class="flex-1 p-4 overflow-auto bg-slate-200/60 flex items-center justify-center min-h-[500px]">
              <div class="w-[420px] h-[594px] max-w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
                <FeaturesTemplatesA4PreviewFit
                  v-if="!isLetter && currentResumeSnapshot"
                  :resume="currentResumeSnapshot"
                />
                <FeaturesCoverLetterTemplatesA4PreviewFit
                  v-else-if="isLetter && currentLetterSnapshot"
                  :letter="currentLetterSnapshot"
                />
              </div>
            </div>
            <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                @click="triggerDownload(); isPreviewModalOpen = false"
              >
                Télécharger ce document PDF
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall 3.5s ease-out forwards;
}

@keyframes confetti-fall {
  0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
