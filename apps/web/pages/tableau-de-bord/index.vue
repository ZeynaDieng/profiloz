<script setup lang="ts">
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

const authStore = useAuthStore()
const resumeService = useResumeService()

const resumes = ref<ResumeCard[]>([])
const loading = ref(true)
const error = ref('')
const profileStrength = ref({ score: 0, missingSections: [] as string[] })
const profileResume = ref<ResumeCard | null>(null)

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
    error.value = 'Impossible de charger vos CV.'
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
  await loadResumes()
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop">
    <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-stack-lg">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Mes CV</h1>
        <p class="text-on-surface-variant">Reprenez où vous en étiez.</p>
      </div>
      <NuxtLink to="/creer" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 w-full sm:w-auto min-h-11">
        <UiPzIcon name="add" class="text-[18px]" />
        Nouveau CV
      </NuxtLink>
    </div>

    <!-- Actions rapides (desktop uniquement — le bouton principal suffit sur mobile) -->
    <div class="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-stack-lg">
      <NuxtLink
        to="/creer"
        class="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary transition-colors"
      >
        <UiPzIcon name="add" class="text-secondary text-[24px]" />
        <div>
          <p class="font-bold text-on-surface text-sm">Nouveau CV</p>
          <p class="text-xs text-on-surface-variant">Créer from scratch</p>
        </div>
      </NuxtLink>
      <NuxtLink
        to="/tableau-de-bord/lettres/nouvelle"
        class="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary transition-colors"
      >
        <UiPzIcon name="mail" class="text-secondary text-[24px]" />
        <div>
          <p class="font-bold text-on-surface text-sm">Nouvelle lettre</p>
          <p class="text-xs text-on-surface-variant">Bientôt disponible</p>
        </div>
      </NuxtLink>
      <NuxtLink
        to="/creer/importer/cv"
        class="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary transition-colors"
      >
        <UiPzIcon name="upload_file" class="text-secondary text-[24px]" />
        <div>
          <p class="font-bold text-on-surface text-sm">Importer un document</p>
          <p class="text-xs text-on-surface-variant">CV, diplôme, attestation</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Statistiques -->
    <div v-if="!loading && resumes.length" class="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-stack-lg">
      <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
        <p class="text-2xl font-bold text-on-surface">{{ stats.cvCount }}</p>
        <p class="text-xs text-on-surface-variant">CV créés</p>
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
          <article
            v-for="item in resumes"
            :key="item.id"
            class="bg-surface border border-outline-variant rounded-xl p-4 sm:p-stack-md flex flex-row sm:flex-col sm:aspect-[3/4] sm:justify-between gap-3 hover:border-secondary transition-colors"
          >
            <div class="min-w-0 flex-1">
              <h2 class="font-bold text-on-surface line-clamp-2">{{ item.fullName || item.title }}</h2>
              <p v-if="item.jobTitle" class="text-sm text-on-surface-variant mt-1 line-clamp-1">{{ item.jobTitle }}</p>
              <p class="text-xs text-on-surface-variant mt-2 sm:hidden">Mis à jour le {{ formatDate(item.updatedAt) }}</p>
            </div>

            <div class="shrink-0 flex flex-col justify-end gap-2 sm:w-full">
              <p class="text-xs text-on-surface-variant mb-1 hidden sm:block">Mis à jour le {{ formatDate(item.updatedAt) }}</p>
              <NuxtLink
                :to="`/creer/editeur?id=${item.id}`"
                class="inline-flex items-center justify-center min-h-11 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-bold whitespace-nowrap"
              >
                Modifier
              </NuxtLink>
            </div>
          </article>

          <NuxtLink
            to="/creer"
            class="min-h-[72px] sm:aspect-[3/4] border-2 border-dashed border-outline-variant rounded-xl flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-stack-sm text-on-surface-variant/40 hover:text-secondary hover:border-secondary transition-all p-4"
          >
            <UiPzIcon name="add" class="text-2xl sm:text-3xl" />
            <span class="font-bold">Créer un CV</span>
          </NuxtLink>
        </div>
      </div>

      <div v-if="!loading && profileResume" class="xl:sticky xl:top-6 h-fit hidden xl:block">
        <DashboardProfileStrengthWidget
          :score="profileStrength.score"
          :missing-sections="profileStrength.missingSections"
          :resume-title="profileResume.fullName || profileResume.title"
          :resume-id="profileResume.id"
        />
      </div>
    </div>
  </div>
</template>
