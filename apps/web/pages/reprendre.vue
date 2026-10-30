<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { ensurePaidGuestDossier, pinPaidGuestSession } from '~/utils/guest-dossier-state'
import { defaultLetterAccentColor } from '~/utils/template-accent-colors'
import { DEFAULT_CLOSING_TEXT, normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'

/**
 * Lien « Reprendre mon dossier » (e-mail de téléchargement) : recharge les documents
 * du dossier payé d'un invité (2 au choix : CV et/ou lettres) sur n'importe quel appareil.
 */
definePageMeta({ layout: 'default' })
useSeoPage({ title: 'Reprendre mon dossier', noindex: true })

const route = useRoute()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const paymentService = usePaymentService()
const { applyGuestSessionId, ensureSession } = useGuestSession()

type DossierDocument = { key: string; kind: 'cv' | 'letter'; label: string; snapshot: Record<string, any> }

const state = ref<'loading' | 'ready' | 'empty' | 'error'>('loading')
const documents = ref<DossierDocument[]>([])
/** Un dossier = 2 documents au choix : s'il en reste un, proposer de le créer. */
const canAddDocument = computed(() => documents.value.length < 2)

function asResume(value: unknown): ResumeSnapshot | null {
  const snap = value as ResumeSnapshot | null
  return snap && typeof snap === 'object' && snap.personalInfo ? snap : null
}

function asLetter(value: unknown): Record<string, any> | null {
  const snap = value as Record<string, any> | null
  return snap && typeof snap === 'object' && typeof snap.content === 'string' && !snap.personalInfo ? snap : null
}

function toDocument(key: string, kind: 'cv' | 'letter', snapshot: Record<string, any>): DossierDocument {
  const label = kind === 'cv'
    ? `CV de ${snapshot.personalInfo?.fullName?.trim() || 'votre dossier'}`
    : `Lettre${snapshot.companyName?.trim() ? ` pour ${snapshot.companyName.trim()}` : snapshot.position?.trim() ? ` – ${snapshot.position.trim()}` : ' de motivation'}`
  return { key, kind, label, snapshot }
}

function loadLetter(letter: Record<string, any>) {
  const templateSlug = normalizeCoverLetterTemplateSlug(letter.templateSlug)
  coverLetterStore.current = {
    id: letter.id,
    templateSlug,
    senderName: letter.senderName ?? '',
    senderEmail: letter.senderEmail ?? '',
    senderPhone: letter.senderPhone ?? '',
    senderLocation: letter.senderLocation ?? '',
    companyName: letter.companyName ?? '',
    companyAddress: letter.companyAddress ?? '',
    position: letter.position ?? '',
    recruiterName: letter.recruiterName ?? '',
    content: letter.content,
    closingText: letter.closingText ?? DEFAULT_CLOSING_TEXT,
    accentColor: letter.accentColor ?? defaultLetterAccentColor(templateSlug),
    signatureUrl: letter.signatureUrl ?? '',
    lastModified: new Date().toISOString(),
  }
}

async function openDocument(doc: DossierDocument) {
  if (doc.kind === 'cv') {
    resumeStore.loadSnapshot(doc.snapshot as ResumeSnapshot)
    await navigateTo('/creer/editeur')
  } else {
    loadLetter(doc.snapshot)
    await navigateTo('/creer/lettre/editeur')
  }
}

onMounted(async () => {
  const gs = typeof route.query.gs === 'string' ? route.query.gs.trim() : ''
  if (!gs) {
    state.value = 'empty'
    return
  }

  try {
    applyGuestSessionId(gs)
    pinPaidGuestSession(gs)
    await ensureSession()
    const entitlements = await paymentService.getEntitlements({ withDrafts: true })
    if (!hasDossierDownloadAccess(entitlements)) {
      state.value = 'empty'
      return
    }

    const docs: DossierDocument[] = []
    for (const doc of entitlements.paidDocuments ?? []) {
      const snap = doc.kind === 'cv' ? asResume(doc.snapshot) : asLetter(doc.snapshot)
      if (snap) docs.push(toDocument(doc.key, doc.kind, snap))
    }
    // Dossiers enregistrés avant le suivi par document : dernière version du CV / de la lettre
    if (!docs.length) {
      const resume = asResume(entitlements.paidResumeSnapshot) ?? asResume(entitlements.paidDraftSnapshot)
      const letter = asLetter(entitlements.paidLetterSnapshot) ?? asLetter(entitlements.paidDraftSnapshot)
      if (resume) docs.push(toDocument(`cv:${resume.id}`, 'cv', resume))
      if (letter) docs.push(toDocument(`letter:${letter.id}`, 'letter', letter))
    }

    if (!docs.length) {
      state.value = 'empty'
      return
    }

    // Pré-charger le dernier CV et la dernière lettre : les éditeurs s'ouvrent directement dessus
    const lastResume = [...docs].reverse().find((doc) => doc.kind === 'cv')
    const lastLetter = [...docs].reverse().find((doc) => doc.kind === 'letter')
    if (lastResume) resumeStore.loadSnapshot(lastResume.snapshot as ResumeSnapshot)
    if (lastLetter) loadLetter(lastLetter.snapshot)

    documents.value = docs
    ensurePaidGuestDossier(docs[0]!.kind)
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
})
</script>

<template>
  <div class="page-container max-w-lg mx-auto py-12 md:py-20 text-center">
    <div v-if="state === 'loading'" class="space-y-4">
      <UiSkeleton variant="circle" width="4rem" height="4rem" class="mx-auto" />
      <p class="text-on-surface-variant">Récupération de votre dossier…</p>
    </div>

    <template v-else-if="state === 'ready'">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-6">
        <UiPzIcon name="check_circle" class="text-[36px]" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Votre dossier est de retour</h1>
      <p class="text-on-surface-variant mb-6 text-sm sm:text-base">
        Modifiez et retéléchargez vos documents sans repayer.
        <template v-if="canAddDocument">Votre dossier inclut encore un document au choix (CV ou lettre).</template>
      </p>
      <div class="flex flex-col gap-3">
        <UiButton
          v-for="(doc, i) in documents"
          :key="doc.key"
          :variant="i === 0 ? 'secondary' : 'outline'"
          block
          :icon="doc.kind === 'cv' ? 'edit_note' : 'mail'"
          @click="openDocument(doc)"
        >
          Ouvrir : {{ doc.label }}
        </UiButton>
        <template v-if="canAddDocument">
          <NuxtLink to="/creer/editeur?new=1">
            <UiButton variant="ghost" block icon="add">Créer un CV</UiButton>
          </NuxtLink>
          <NuxtLink to="/creer/lettre/modele?new=1">
            <UiButton variant="ghost" block icon="add">Créer une lettre de motivation</UiButton>
          </NuxtLink>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant mb-6">
        <UiPzIcon name="info" class="text-[36px]" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">
        {{ state === 'error' ? 'Récupération impossible pour le moment' : 'Aucun dossier à reprendre' }}
      </h1>
      <p class="text-on-surface-variant mb-6 text-sm sm:text-base">
        {{ state === 'error'
          ? 'Vérifiez votre connexion puis rouvrez le lien reçu par e-mail.'
          : "Ce lien ne correspond à aucun dossier payé. Utilisez le lien « Reprendre mon dossier » reçu par e-mail après votre téléchargement." }}
      </p>
      <NuxtLink to="/creer">
        <UiButton variant="outline" block>Créer mon CV</UiButton>
      </NuxtLink>
    </template>
  </div>
</template>
