<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { ensurePaidGuestDossier, pinPaidGuestSession } from '~/utils/guest-dossier-state'
import { defaultLetterAccentColor } from '~/utils/template-accent-colors'
import { DEFAULT_CLOSING_TEXT, normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'

/**
 * Lien « Reprendre mon dossier » (e-mail de téléchargement) : recharge le CV et la lettre
 * du dossier payé d'un invité sur n'importe quel appareil.
 */
definePageMeta({ layout: 'default' })
useSeoPage({ title: 'Reprendre mon dossier', noindex: true })

const route = useRoute()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const paymentService = usePaymentService()
const { applyGuestSessionId, ensureSession } = useGuestSession()

const state = ref<'loading' | 'ready' | 'empty' | 'error'>('loading')
const hasResume = ref(false)
const hasLetter = ref(false)

function asResume(value: unknown): ResumeSnapshot | null {
  const snap = value as ResumeSnapshot | null
  return snap && typeof snap === 'object' && snap.personalInfo ? snap : null
}

function asLetter(value: unknown): Record<string, any> | null {
  const snap = value as Record<string, any> | null
  return snap && typeof snap === 'object' && typeof snap.content === 'string' && !snap.personalInfo ? snap : null
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

    const resume = asResume(entitlements.paidResumeSnapshot) ?? asResume(entitlements.paidDraftSnapshot)
    const letter = asLetter(entitlements.paidLetterSnapshot) ?? asLetter(entitlements.paidDraftSnapshot)

    if (resume) {
      resumeStore.loadSnapshot(resume)
      hasResume.value = true
    }
    if (letter) {
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
      hasLetter.value = true
    }

    if (!resume && !letter) {
      state.value = 'empty'
      return
    }
    ensurePaidGuestDossier(resume ? 'cv' : 'letter')
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
        Vous pouvez modifier et retélécharger votre CV et votre lettre sans repayer.
      </p>
      <div class="flex flex-col gap-3">
        <NuxtLink v-if="hasResume" to="/creer/editeur">
          <UiButton variant="secondary" block icon="edit_note">Ouvrir mon CV</UiButton>
        </NuxtLink>
        <NuxtLink :to="hasLetter ? '/creer/lettre/editeur' : '/creer/lettre/modele'">
          <UiButton :variant="hasResume ? 'outline' : 'secondary'" block icon="mail">
            {{ hasLetter ? 'Ouvrir ma lettre de motivation' : 'Créer ma lettre de motivation' }}
          </UiButton>
        </NuxtLink>
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
