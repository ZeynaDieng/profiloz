<script setup lang="ts">
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

const authStore = useAuthStore()
const resumeService = useResumeService()
const coverLetterService = useCoverLetterService()

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

const stats = computed(() => ({
  cvCount: resumes.value.length,
  lastUpdated: resumes.value[0]?.updatedAt ?? null,
}))

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
    error.value = 'Impossible de charger vos dossiers.'
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
    error.value = 'Impossible de classer la lettre dans ce dossier.'
  } finally {
    attachingId.value = null
  }
}

async function onDeleteLetter(letterId: string) {
  if (import.meta.client && !window.confirm('Supprimer définitivement cette lettre ?')) return
  deletingId.value = letterId
  error.value = ''
  try {
    await coverLetterService.remove(letterId)
    orphanLetters.value = orphanLetters.value.filter((l) => l.id !== letterId)
    delete attachTarget.value[letterId]
  } catch {
    error.value = 'Impossible de supprimer la lettre.'
  } finally {
    deletingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-stack-lg">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Mes dossiers</h1>
        <p class="text-on-surface-variant">Reprenez où vous en étiez.</p>
      </div>
      <NuxtLink to="/creer" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 w-full sm:w-auto min-h-11">
        <UiPzIcon name="add" class="text-[18px]" />
        Nouveau dossier
      </NuxtLink>
    </div>

    <!-- Actions rapides (desktop uniquement — le bouton principal suffit sur mobile) -->
    <div class="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-stack-lg">
      <NuxtLink
        to="/creer"
        class="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary transition-colors"
      >
        <UiPzIcon name="add" class="text-secondary text-[24px]" />
        <div>
          <p class="font-bold text-on-surface text-sm">Nouveau dossier</p>
          <p class="text-xs text-on-surface-variant">CV + lettre, prêt à envoyer</p>
        </div>
      </NuxtLink>
      <NuxtLink
        to="/creer/importer/cv"
        class="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary transition-colors"
      >
        <UiPzIcon name="upload_file" class="text-secondary text-[24px]" />
        <div>
          <p class="font-bold text-on-surface text-sm">Importer un document</p>
          <p class="text-xs text-on-surface-variant">CV et lettres de motivation</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Statistiques -->
    <div v-if="!loading && resumes.length" class="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-stack-lg">
      <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
        <p class="text-2xl font-bold text-on-surface">{{ stats.cvCount }}</p>
        <p class="text-xs text-on-surface-variant">Dossiers créés</p>
      </div>
      <div v-if="stats.lastUpdated" class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
        <p class="text-sm font-bold text-on-surface">{{ formatDate(stats.lastUpdated) }}</p>
        <p class="text-xs text-on-surface-variant">Dernière modification</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-gutter mb-stack-lg">
      <div>
        <p v-if="loading" class="text-on-surface-variant">Chargement...</p>
        <p v-else-if="error" class="text-error mb-4">{{ error }}</p>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
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
      </div>

      <div v-if="!loading && profileResume" class="xl:sticky xl:top-6 h-fit hidden xl:block">
        <DashboardProfileStrengthWidget
          :score="profileStrength.score"
          :missing-sections="profileStrength.missingSections"
          :resume-title="resolveDossierName({ fullName: profileResume.fullName, title: profileResume.title })"
          :resume-id="profileResume.id"
        />
      </div>
    </div>

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

      <ul class="divide-y divide-outline-variant/30">
        <li
          v-for="letter in orphanLetters"
          :key="letter.id"
          class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-semibold text-on-surface truncate">{{ letter.title }}</p>
            <p class="text-xs text-on-surface-variant truncate">
              <span v-if="letter.position">{{ letter.position }}</span>
              <span v-if="letter.position && letter.companyName"> · </span>
              <span v-if="letter.companyName">{{ letter.companyName }}</span>
              <span v-if="!letter.position && !letter.companyName">Mise à jour le {{ formatDate(letter.updatedAt) }}</span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select
              v-model="attachTarget[letter.id]"
              class="min-h-11 px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface max-w-[180px]"
              :disabled="!resumes.length"
            >
              <option value="">Choisir un dossier…</option>
              <option v-for="dossier in resumes" :key="dossier.id" :value="dossier.id">
                {{ resolveDossierName({ fullName: dossier.fullName, title: dossier.title }) }}
              </option>
            </select>
            <button
              type="button"
              class="min-h-11 px-3 py-2 text-sm font-bold bg-secondary text-on-secondary rounded-lg disabled:opacity-50"
              :disabled="!attachTarget[letter.id] || attachingId === letter.id"
              @click="onAttachLetter(letter.id)"
            >
              {{ attachingId === letter.id ? 'Classement…' : 'Classer' }}
            </button>
            <NuxtLink
              :to="`/tableau-de-bord/lettres/${letter.id}`"
              class="min-h-11 px-3 py-2 text-sm font-bold text-secondary hover:bg-secondary/5 rounded-lg inline-flex items-center"
            >
              Modifier
            </NuxtLink>
            <button
              type="button"
              class="min-h-11 px-3 py-2 text-sm font-semibold text-error hover:bg-error/5 rounded-lg disabled:opacity-50"
              :disabled="deletingId === letter.id"
              @click="onDeleteLetter(letter.id)"
            >
              {{ deletingId === letter.id ? 'Suppression…' : 'Supprimer' }}
            </button>
          </div>
        </li>
      </ul>

      <p v-if="!resumes.length" class="text-xs text-on-surface-variant mt-3">
        Créez d'abord un dossier pour pouvoir y classer ces lettres.
      </p>
    </section>
  </div>
</template>
