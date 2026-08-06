<script setup lang="ts">
import { MSG, type TemplateSlug } from '@profiloz/shared'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
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

function isResumeSnapshotValid(snap: any): boolean {
  if (!snap || typeof snap !== 'object') return false
  const p = snap.personalInfo || {}
  const hasName = Boolean((p.firstName || p.lastName || p.fullName)?.trim())
  const hasExp = Boolean(snap.experiences?.length)
  const hasSkills = Boolean(snap.skills?.length)
  const hasSummary = Boolean(snap.summary?.trim())
  return hasName || hasExp || hasSkills || hasSummary
}

function isLetterSnapshotValid(draft: any): boolean {
  if (!draft || typeof draft !== 'object') return false
  return Boolean(draft.content?.trim() || draft.senderName?.trim() || draft.recipientName?.trim())
}

const currentResumeSnapshot = computed(() => {
  let snap: ResumeSnapshot | null = null
  const storeTemplateSlug = resumeStore.current?.templateSlug

  if (isResumeSnapshotValid(resumeStore.current)) {
    snap = {
      ...resumeStore.current!,
      templateConfig: { ...resumeStore.current!.templateConfig },
    }
  } else {
    const serverDraft = entitlements.value?.paidDraftSnapshot
    if (isResumeSnapshotValid(serverDraft)) {
      snap = serverDraft as any
      try { resumeStore.loadSnapshot(serverDraft as any) } catch {}
    } else {
      const backup = loadPaymentDraftBackup()
      if (backup?.kind === 'resume' && isResumeSnapshotValid(backup.snapshot)) {
        snap = backup.snapshot
        try { resumeStore.loadSnapshot(backup.snapshot) } catch {}
      } else {
        const fromStorage = findResumeSnapshotInStorage()
        if (isResumeSnapshotValid(fromStorage)) {
          snap = fromStorage
          try { resumeStore.loadSnapshot(fromStorage!) } catch {}
        }
      }
    }
  }

  // Priorité absolue au modèle sélectionné en cours par l'utilisateur
  const slug = (storeTemplateSlug ?? snap?.templateSlug ?? 'PROFESSIONNEL') as TemplateSlug
  if (snap) {
    snap.templateSlug = slug
    snap.templateConfig = {
      ...snap.templateConfig,
      accentColor: snap.templateConfig?.accentColor ?? cvTemplateAccentColors(slug).accent,
    }
  }
  const accent = snap?.templateConfig?.accentColor ?? cvTemplateAccentColors(slug).accent

  return buildPreviewSnapshot(slug, accent, snap)
})

const currentLetterSnapshot = computed(() => {
  let draft: any = null

  if (isLetterSnapshotValid(coverLetterStore.current)) {
    draft = coverLetterStore.toSnapshot()
  } else {
    const serverDraft = entitlements.value?.paidDraftSnapshot
    if (isLetterSnapshotValid(serverDraft)) {
      draft = serverDraft
    } else {
      const backup = loadPaymentDraftBackup()
      if (backup?.kind === 'letter' && isLetterSnapshotValid(backup.draft)) {
        draft = backup.draft
      } else {
        const fromStorage = findCoverLetterDraftInStorage()
        if (isLetterSnapshotValid(fromStorage)) {
          draft = fromStorage
        }
      }
    }
  }

  return {
    id: draft?.id || 'letter-1',
    templateSlug: draft?.templateSlug || 'CLASSIQUE',
    senderName: draft?.senderName || 'Aminata Diallo',
    recipientName: draft?.recipientName || 'Responsable des Ressources Humaines',
    jobTitle: draft?.jobTitle || 'Chef de Projet Marketing & Communication',
    companyName: draft?.companyName || 'Société X',
    content: draft?.content || 'Madame, Monsieur,\n\nC’est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de Projet.\nFort de plusieurs années d’expérience dans la gestion de projets et le marketing stratégique, j’ai développé une solide expertise qui me permet d’apporter une valeur ajoutée immédiate à votre équipe.\n\nJe reste à votre disposition pour un entretien.\n\nCordialement,\nAminata Diallo',
    accentColor: draft?.accentColor || '#316bf3',
    fontSize: draft?.fontSize || 'medium',
  }
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
  if (nextDocument.value === 'cv') return 'Profitez de votre CV offert'
  if (nextDocument.value === 'letter') return 'Profitez de votre Lettre offerte'
  return 'Profitez de votre document offert'
})

const crossSellBody = computed(() => {
  if (nextDocument.value === 'cv') {
    return 'Votre commande inclut votre CV professionnel offert : créez-le à zéro ou importez un fichier existant.'
  }
  if (nextDocument.value === 'letter') {
    return 'Votre commande inclut votre Lettre de Motivation offerte : générez une lettre personnalisée par l\'IA assortie à votre CV.'
  }
  return 'Votre commande inclut 1 document offert au choix.'
})

const crossSellCta = computed(() => {
  if (nextDocument.value === 'cv') return 'Créer mon CV offert'
  if (nextDocument.value === 'letter') return 'Créer ma Lettre offerte'
  return 'Profiter de mon bonus'
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
  navigateTo('/creer/modele?new=1')
}

function startImportCv() {
  resumeStore.startNewDraft()
  clearPaymentDraftBackup()
  navigateTo('/creer/importer/cv')
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
  if (import.meta.client) {
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = window.location.href
        return
      } catch (_) {}
    }
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.href = window.location.href
        window.close()
        return
      } catch (_) {}
    }
  }

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
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 animate-bounce shadow-sm">
          <UiPzIcon name="celebration" class="text-3xl" />
        </div>
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
            <FeatureTemplatesA4PreviewFit
              v-if="!isLetter && currentResumeSnapshot"
              :resume="currentResumeSnapshot"
            />
            <FeatureCoverLetterTemplatesA4PreviewFit
              v-else-if="isLetter && currentLetterSnapshot"
              :letter="currentLetterSnapshot"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400">
              <UiPzIcon name="description" class="text-5xl mb-2 text-slate-300" />
              <span class="text-xs font-medium text-slate-500">Document généré en HD</span>
            </div>
          </div>

          <!-- Actions rapides sur le document actif -->
          <div class="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors shadow-2xs"
              @click="isPreviewModalOpen = true"
            >
              <UiPzIcon name="visibility" class="text-sm" />
              <span>Aperçu HD</span>
            </button>

            <NuxtLink
              :to="isLetter ? '/creer/lettre/editeur' : '/creer/editeur'"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors shadow-2xs"
            >
              <UiPzIcon name="edit" class="text-sm text-blue-600" />
              <span>Modifier ce document</span>
            </NuxtLink>

            <NuxtLink
              :to="isLetter ? '/creer/lettre/modele?returnTo=/creer/succes' : '/creer/modele?returnTo=/creer/succes'"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 transition-colors shadow-2xs"
            >
              <UiPzIcon name="palette" class="text-sm text-slate-500" />
              <span>Changer le modèle</span>
            </NuxtLink>
          </div>
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

        <!-- 🎁 BANNIÈRE BONUS EN VEDETTE & HUB D'ACTIONS "ET ENSUITE ?" -->
        <div class="w-full max-w-xl mt-6 space-y-4 text-left">
          <!-- Carte Hero Bonus ultra mise en valeur (Choix explicite du 2ème document inclus) -->
          <div v-if="showCrossSell" class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-5 sm:p-6 shadow-xl border border-emerald-500/30 space-y-4">
            <!-- Motif lumineux de fond -->
            <div class="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div class="relative z-10 space-y-1.5 min-w-0">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                <UiPzIcon name="card_giftcard" class="text-xs text-slate-950" />
                <span>Votre 2ème document est 100% Inclus !</span>
              </div>
              <h2 class="text-base sm:text-xl font-extrabold text-white leading-snug">
                Choisissez votre 2ème document offert
              </h2>
              <p class="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-lg">
                Votre formule comprend 2 documents au choix. Sélectionnez le 2ème document que vous désirez créer maintenant :
              </p>
            </div>

            <!-- Les 2 Choix Directs pour l'utilisateur -->
            <div class="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <!-- Choix 1 : Le document complémentaire (Lettre si CV en 1er, CV si Lettre en 1er) -->
              <NuxtLink :to="isLetter ? '/creer/modele' : '/creer/lettre/modele'" class="block">
                <div class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-between gap-3 group cursor-pointer">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-xl shrink-0">{{ isLetter ? '📄' : '✉️' }}</span>
                    <div class="min-w-0">
                      <div class="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                        {{ isLetter ? 'Un CV professionnel' : 'Une Lettre de motivation' }}
                      </div>
                      <div class="text-[11px] text-emerald-100/80 truncate">
                        {{ isLetter ? 'Assorti à votre lettre' : 'Rédigée par l’IA & sur-mesure' }}
                      </div>
                    </div>
                  </div>
                  <div class="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-extrabold text-[11px] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    Choisir
                  </div>
                </div>
              </NuxtLink>

              <!-- Choix 2 : Un 2ème document du même type (2ème CV si CV en 1er, 2ème Lettre si Lettre en 1er) -->
              <NuxtLink :to="isLetter ? '/creer/lettre/modele' : '/creer/modele'" class="block">
                <div class="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-between gap-3 group cursor-pointer">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-xl shrink-0">{{ isLetter ? '✉️' : '📄' }}</span>
                    <div class="min-w-0">
                      <div class="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                        {{ isLetter ? 'Une 2ème Lettre IA' : 'Un 2ème CV (ou réimport)' }}
                      </div>
                      <div class="text-[11px] text-emerald-100/80 truncate">
                        {{ isLetter ? 'Pour une autre entreprise' : 'Autre poste / candidature' }}
                      </div>
                    </div>
                  </div>
                  <div class="px-3 py-1.5 rounded-xl bg-white/90 text-emerald-950 font-extrabold text-[11px] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    Choisir
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Si le dossier complet (CV + Lettre) a déjà été entièrement téléchargé -->
          <div v-else-if="dossierComplete" class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 shadow-xl border border-emerald-500/30">
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-extrabold text-2xl shrink-0">
                🏆
              </div>
              <div class="space-y-1">
                <h2 class="text-base sm:text-lg font-extrabold text-white leading-snug">
                  Votre dossier de candidature est 100% complet !
                </h2>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Félicitations ! Vous disposez désormais de votre CV et de votre Lettre de Motivation parfaitement assortis et prêts pour vos candidatures.
                </p>
              </div>
            </div>
          </div>

          <!-- Grille d'actions rapide : Lettre, Importer un CV ou Nouveau CV vierge -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Option 1 : Lettre de motivation -->
            <div
              class="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer"
              @click="startSecondLetter"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                  <UiPzIcon name="mail" class="text-xl text-emerald-600" />
                </div>
                <div>
                  <div class="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Créer ma lettre IA
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Rédigez une lettre personnalisée par l'IA assortie à votre CV.
                  </p>
                </div>
              </div>
              <div class="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform mt-1">
                <span>Rédiger ma lettre</span>
                <UiPzIcon name="arrow_forward" class="text-sm ml-1" />
              </div>
            </div>

            <!-- Option 2 : Importer un CV existant (PDF, Word) -->
            <div
              class="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer"
              @click="startImportCv"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0 border border-teal-100">
                  <UiPzIcon name="file_upload" class="text-xl text-teal-600" />
                </div>
                <div>
                  <div class="text-xs font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                    Importer un CV
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Extraire vos données depuis un fichier PDF ou Word.
                  </p>
                </div>
              </div>
              <div class="flex items-center text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform mt-1">
                <span>Importer un fichier</span>
                <UiPzIcon name="arrow_forward" class="text-sm ml-1" />
              </div>
            </div>

            <!-- Option 3 : Nouveau CV vierge -->
            <div
              class="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer"
              @click="startSecondCv"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                  <UiPzIcon name="add_circle" class="text-xl text-blue-600" />
                </div>
                <div>
                  <div class="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Nouveau CV vierge
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Partir d'un modèle vierge et remplir votre CV à zéro.
                  </p>
                </div>
              </div>
              <div class="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform mt-1">
                <span>Partir à zéro</span>
                <UiPzIcon name="arrow_forward" class="text-sm ml-1" />
              </div>
            </div>
          </div>
        </div>

        <!-- Rangée 3 Garanties & Valeur Profilo'Z -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-xl mt-8 pt-6 border-t border-slate-100">
          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50/80 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
              <UiPzIcon name="picture_as_pdf" class="text-lg text-blue-600" />
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-extrabold text-slate-800">PDF Haute Définition</div>
              <div class="text-[11px] text-slate-500 mt-0.5 leading-snug">Rendu vectoriel net pour impression et envoi direct.</div>
            </div>
          </div>

          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50/80 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              <UiPzIcon name="verified" class="text-lg text-emerald-600" />
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-extrabold text-slate-800">100% Compatible ATS</div>
              <div class="text-[11px] text-slate-500 mt-0.5 leading-snug">Mise en page analysée sans erreur par les recruteurs.</div>
            </div>
          </div>

          <div class="flex items-center md:flex-col md:text-center gap-3 p-3 rounded-xl bg-slate-50/80 md:bg-transparent">
            <div class="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 font-bold">
              <UiPzIcon name="cloud_done" class="text-lg text-teal-600" />
            </div>
            <div class="text-left md:text-center">
              <div class="text-xs font-extrabold text-slate-800">Disponible & Éditable</div>
              <div class="text-[11px] text-slate-500 mt-0.5 leading-snug">Modifiez vos données quand vous le souhaitez.</div>
            </div>
          </div>
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
            <span>{{ copiedName ? 'Copié !' : 'Copier le nom' }}</span>
            <UiPzIcon :name="copiedName ? 'check' : 'content_copy'" class="text-sm" :class="copiedName ? 'text-emerald-600' : 'text-slate-400'" />
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
              :class="isHelpOpen ? 'rotate-180' : ''"
            />
          </button>

          <div v-if="isHelpOpen" class="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-blue-100/60 space-y-2.5">
            <div class="flex items-center gap-2">
              <UiPzIcon name="phone_iphone" class="text-base text-slate-700 shrink-0" />
              <span class="font-bold text-slate-800 shrink-0">iPhone :</span>
              <span>Ouvrez l'application <strong>Fichiers</strong> ➔ <em>Téléchargements</em> (ou touchez l'icône <span class="text-blue-600">↓</span> dans la barre d'adresse de Safari).</span>
            </div>
            <div class="flex items-center gap-2">
              <UiPzIcon name="android" class="text-base text-slate-700 shrink-0" />
              <span class="font-bold text-slate-800 shrink-0">Android :</span>
              <span>Glissez le panneau de notifications vers le bas ou ouvrez l'application <strong>Mes Fichiers</strong> ➔ <em>Téléchargements</em>.</span>
            </div>
            <div class="flex items-center gap-2">
              <UiPzIcon name="computer" class="text-base text-slate-700 shrink-0" />
              <span class="font-bold text-slate-800 shrink-0">Ordi :</span>
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
            <UiPzIcon name="home" class="text-base" />
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
                <FeatureTemplatesA4PreviewFit
                  v-if="!isLetter && currentResumeSnapshot"
                  :resume="currentResumeSnapshot"
                />
                <FeatureCoverLetterTemplatesA4PreviewFit
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
