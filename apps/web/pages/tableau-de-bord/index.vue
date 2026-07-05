<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { resolveDossierName } from '~/utils/dossierName'

definePageMeta({ layout: 'dashboard' })

interface ResumeCard {
  id: string
  title: string
  status: string
  templateSlug: string
  completeness: number
  fullName?: string
  jobTitle?: string
  updatedAt: string
}

interface OrphanLetter {
  id: string
  title: string
  companyName?: string | null
  position?: string | null
  updatedAt: string
  resumeId?: string | null
}

const route = useRoute()
const authStore = useAuthStore()

const showWelcome = computed(() => route.query.welcome === '1')
const resumeService = useResumeService()
const coverLetterService = useCoverLetterService()
const { confirm } = useConfirm()

const resumes = ref<ResumeCard[]>([])
const loading = ref(true)
const error = ref('')
const profileStrength = ref({ score: 0, missingSections: [] as string[] })
const profileResume = ref<ResumeCard | null>(null)

const orphanLetters = ref<OrphanLetter[]>([])
const letterCountByResume = ref<Record<string, number>>({})
const attachTarget = ref<Record<string, string>>({})
const attachingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

const greetingName = computed(() => {
  const email = authStore.user?.email
  if (!email) return ''
  const local = email.split('@')[0] ?? ''
  const first = local.split(/[._-]/)[0] ?? local
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1)
})

async function loadResumes() {
  loading.value = true
  error.value = ''
  try {
    const result = await resumeService.listResumes()
    resumes.value = result.data

    if (result.data.length > 0) {
      const latest = result.data[0]!
      profileResume.value = latest
      try {
        profileStrength.value = await resumeService.getCompleteness(latest.id)
      } catch {
        profileStrength.value = {
          score: latest.completeness,
          missingSections: [],
        }
      }
    } else {
      profileResume.value = null
    }
  } catch {
    error.value = MSG.error.loadResumes
  } finally {
    loading.value = false
  }
}

async function loadLetters() {
  try {
    const result = await coverLetterService.list()
    const letters = result.data as OrphanLetter[]
    orphanLetters.value = letters.filter((l) => !l.resumeId)
    const counts: Record<string, number> = {}
    for (const letter of letters) {
      if (letter.resumeId) counts[letter.resumeId] = (counts[letter.resumeId] ?? 0) + 1
    }
    letterCountByResume.value = counts
  } catch {
    orphanLetters.value = []
    letterCountByResume.value = {}
  }
}

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }
  await loadResumes()
  await loadLetters()
})

async function onAttachLetter(letterId: string) {
  const resumeId = attachTarget.value[letterId]
  if (!resumeId) return
  attachingId.value = letterId
  error.value = ''
  try {
    // Le PATCH coerce les champs absents à null : on renvoie la lettre complète + le rattachement.
    const full = await coverLetterService.getById(letterId)
    await coverLetterService.update(letterId, { ...full, resumeId })
    orphanLetters.value = orphanLetters.value.filter((l) => l.id !== letterId)
    letterCountByResume.value[resumeId] = (letterCountByResume.value[resumeId] ?? 0) + 1
    delete attachTarget.value[letterId]
  } catch {
    error.value = MSG.error.attachLetter
  } finally {
    attachingId.value = null
  }
}

async function onDeleteLetter(letterId: string) {
  const ok = await confirm(MSG.delete.confirmLetter, {
    title: MSG.delete.title,
    confirmLabel: MSG.delete.confirmLabel,
    destructive: true,
  })
  if (!ok) return
  deletingId.value = letterId
  error.value = ''
  try {
    await coverLetterService.remove(letterId)
    orphanLetters.value = orphanLetters.value.filter((l) => l.id !== letterId)
    delete attachTarget.value[letterId]
  } catch {
    error.value = MSG.error.deleteLetter
  } finally {
    deletingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="page-container">
    <section class="mb-stack-lg">
      <UiMessageBanner
        v-if="showWelcome"
        variant="success"
        message="Paiement confirmé — votre offre est active. Retrouvez vos crédits et vos dossiers ci-dessous."
        class="mb-4"
      />
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">
        Bonjour<span v-if="greetingName"> {{ greetingName }}</span> 👋
      </h1>
      <p class="text-on-surface-variant mt-1">{{ MSG.guide.dashboardPrompt }}</p>
      <div class="mt-4 max-w-md">
        <BillingEntitlementsSummary />
      </div>
    </section>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-stack-xl">
      <DashboardAssistantActionCard
        to="/creer"
        icon="edit_note"
        title="Créer un CV"
        description="Guidé étape par étape, en moins de 5 minutes."
      />
      <DashboardAssistantActionCard
        to="/tableau-de-bord/lettres/nouvelle"
        icon="mail"
        title="Créer une lettre"
        description="Rédigez une lettre de motivation professionnelle."
      />
      <DashboardAssistantActionCard
        to="/tableau-de-bord/documents"
        icon="folder_open"
        title="Mes documents"
        description="Retrouvez vos CV et lettres importés."
      />
      <DashboardAssistantActionCard
        to="/tableau-de-bord/modeles"
        icon="dashboard_customize"
        title="Modèles CV"
        description="Parcourez et comparez nos modèles."
      />
    </div>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <section v-if="loading" class="mb-stack-lg">
      <UiSkeleton variant="text" width="40%" class="mb-4" />
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
        <UiSkeleton v-for="i in 3" :key="i" variant="card" />
      </div>
    </section>

    <section v-else-if="resumes.length" class="mb-stack-lg">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-stack-md">
        <div>
          <h2 class="text-xl font-bold text-on-surface">{{ MSG.guide.recentFolders }}</h2>
          <p class="text-sm text-on-surface-variant mt-0.5">Reprenez où vous en étiez.</p>
        </div>
        <NuxtLink to="/creer" class="btn-primary w-full sm:w-auto">
          <UiPzIcon name="add" class="text-[18px]" />
          Nouveau dossier
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-gutter">
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
          <DashboardResumeCard
            v-for="item in resumes"
            :key="item.id"
            :id="item.id"
            :title="item.title"
            :full-name="item.fullName"
            :job-title="item.jobTitle"
            :letter-count="letterCountByResume[item.id] ?? 0"
          >
            <template #date>Mis à jour le {{ formatDate(item.updatedAt) }}</template>
          </DashboardResumeCard>

          <NuxtLink
            to="/creer"
            class="min-h-[72px] sm:aspect-[3/4] border-2 border-dashed border-outline-variant rounded-xl flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-stack-sm text-on-surface-variant/40 hover:text-secondary hover:border-secondary transition-all p-4"
          >
            <UiPzIcon name="add" class="text-2xl sm:text-3xl" />
            <span class="font-bold">Créer un dossier</span>
          </NuxtLink>
        </div>

        <div v-if="profileResume" class="lg:sticky lg:top-6 h-fit">
          <DashboardProfileStrengthWidget
            :score="profileStrength.score"
            :missing-sections="profileStrength.missingSections"
            :resume-title="resolveDossierName({ fullName: profileResume.fullName, title: profileResume.title })"
            :resume-id="profileResume.id"
          />
        </div>
      </div>
    </section>

    <section v-else class="mb-stack-lg text-center py-stack-lg px-4 rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest">
      <UiPzIcon name="description" class="text-4xl text-on-surface-variant/40 mb-3" />
      <p class="text-on-surface font-medium mb-1">{{ MSG.empty.noResume }}</p>
      <p class="text-sm text-on-surface-variant mb-6">Commencez par créer votre premier CV — nous vous guidons pas à pas.</p>
      <NuxtLink to="/creer" class="btn-secondary inline-flex items-center gap-2">
        {{ MSG.guide.createCvCta }}
        <UiPzIcon name="arrow_forward" />
      </NuxtLink>
    </section>

    <!-- Lettres non classées : lettres existantes non rattachées à un dossier -->
    <section
      v-if="!loading && orphanLetters.length"
      class="bg-surface border border-outline-variant rounded-xl p-stack-lg mb-stack-lg"
    >
      <div class="mb-4">
        <h2 class="font-bold text-on-surface">Lettres non classées</h2>
        <p class="text-sm text-on-surface-variant mt-1">
          Ces lettres ne sont rattachées à aucun dossier. Classez-les dans un dossier pour les retrouver facilement.
        </p>
      </div>

      <ul class="space-y-stack-md md:divide-y md:divide-outline-variant/30 md:space-y-0">
        <li
          v-for="letter in orphanLetters"
          :key="letter.id"
          class="md:py-3"
        >
          <UiCard variant="glass" padding="md" class="md:border-0 md:bg-transparent md:p-0 md:rounded-none">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <p class="font-semibold text-on-surface truncate">{{ letter.title }}</p>
                <p class="text-xs text-on-surface-variant truncate mt-0.5">
                  <span v-if="letter.position">{{ letter.position }}</span>
                  <span v-if="letter.position && letter.companyName"> · </span>
                  <span v-if="letter.companyName">{{ letter.companyName }}</span>
                  <span v-if="!letter.position && !letter.companyName">Mise à jour le {{ formatDate(letter.updatedAt) }}</span>
                </p>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center shrink-0">
                <select
                  v-model="attachTarget[letter.id]"
                  class="min-h-11 px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface text-on-surface w-full sm:max-w-[200px]"
                  :disabled="!resumes.length"
                >
                  <option value="">Choisir un dossier…</option>
                  <option v-for="dossier in resumes" :key="dossier.id" :value="dossier.id">
                    {{ resolveDossierName({ fullName: dossier.fullName, title: dossier.title }) }}
                  </option>
                </select>
                <div class="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                  <UiButton
                    variant="secondary"
                    size="sm"
                    block
                    :disabled="!attachTarget[letter.id] || attachingId === letter.id"
                    @click="onAttachLetter(letter.id)"
                  >
                    {{ attachingId === letter.id ? '…' : 'Classer' }}
                  </UiButton>
                  <NuxtLink :to="`/tableau-de-bord/lettres/${letter.id}`" class="contents sm:contents">
                    <UiButton variant="outline" size="sm" block>
                      Modifier
                    </UiButton>
                  </NuxtLink>
                  <UiButton
                    variant="danger"
                    size="sm"
                    block
                    :disabled="deletingId === letter.id"
                    @click="onDeleteLetter(letter.id)"
                  >
                    {{ deletingId === letter.id ? '…' : 'Suppr.' }}
                  </UiButton>
                </div>
              </div>
            </div>
          </UiCard>
        </li>
      </ul>

      <p v-if="!resumes.length" class="text-xs text-on-surface-variant mt-3">
        Créez d'abord un dossier pour pouvoir y classer ces lettres.
      </p>
    </section>
  </div>
</template>
