<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { resolveDossierName } from '~/utils/dossierName'

const props = defineProps<{
  id: string
  title: string
  fullName?: string
  jobTitle?: string
  letterCount?: number
}>()

const resumeService = useResumeService()
const snapshot = ref<ResumeSnapshot | null>(null)
const loadingPreview = ref(true)

const displayName = computed(() => resolveDossierName({ fullName: props.fullName, title: props.title }))

const isReady = computed(() => (props.letterCount ?? 0) > 0)

onMounted(async () => {
  try {
    snapshot.value = await resumeService.getById(props.id)
  } catch {
    snapshot.value = null
  } finally {
    loadingPreview.value = false
  }
})
</script>

<template>
  <article
    class="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-secondary transition-colors flex flex-col"
  >
    <NuxtLink
      :to="`/tableau-de-bord/dossiers/${id}`"
      class="relative block bg-surface-container-low border-b border-outline-variant/20 overflow-hidden
        h-28 sm:h-auto sm:aspect-[3/4]"
      :aria-label="`Ouvrir le dossier ${displayName}`"
    >
      <span
        class="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shadow-sm"
        :class="isReady ? 'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant' : 'bg-surface text-on-surface-variant border border-outline-variant'"
      >
        <UiPzIcon :name="isReady ? 'check_circle' : 'description'" class="text-[13px]" />
        {{ isReady ? 'Prêt à envoyer' : 'CV seul' }}
      </span>
      <FeatureTemplatesA4PreviewFit v-if="snapshot" :resume="snapshot" />
      <div
        v-else-if="loadingPreview"
        class="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant"
      >
        Aperçu...
      </div>
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant px-4 text-center"
      >
        Aperçu indisponible
      </div>
    </NuxtLink>

    <div class="p-4 flex flex-col gap-3 flex-1">
      <NuxtLink :to="`/tableau-de-bord/dossiers/${id}`" class="min-w-0 group">
        <h2 class="font-bold text-on-surface line-clamp-2 group-hover:text-secondary transition-colors">{{ displayName }}</h2>
        <p v-if="jobTitle" class="text-sm text-on-surface-variant mt-1 line-clamp-1">{{ jobTitle }}</p>
        <span
          v-if="letterCount"
          class="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-on-surface-variant"
        >
          <UiPzIcon name="mail" class="text-[14px]" />
          {{ `${letterCount} lettre${letterCount > 1 ? 's' : ''}` }}
        </span>
      </NuxtLink>

      <div class="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p class="text-xs text-on-surface-variant">
          <slot name="date" />
        </p>
        <NuxtLink
          :to="`/creer/editeur?id=${id}`"
          class="inline-flex items-center justify-center min-h-11 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-bold whitespace-nowrap"
        >
          Modifier
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
