<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { toCoverLetterSnapshot } from '~/types/cover-letter'
import { getCoverLetterTemplateBySlug } from '~/features/cover-letter-templates/registry'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'

const props = defineProps<{
  id: string
  title: string
  companyName?: string | null
  position?: string | null
  templateId: string
  updatedAt: string
}>()

const coverLetterService = useCoverLetterService()
const snapshot = ref<CoverLetterSnapshot | null>(null)
const loadingPreview = ref(true)

const templateName = computed(
  () => getCoverLetterTemplateBySlug(normalizeCoverLetterTemplateSlug(props.templateId))?.name,
)

onMounted(async () => {
  try {
    const letter = await coverLetterService.getById(props.id)
    snapshot.value = toCoverLetterSnapshot(letter)
  } catch {
    snapshot.value = null
  } finally {
    loadingPreview.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <article
    class="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-secondary transition-colors flex flex-col"
  >
    <div
      class="relative bg-surface-container-low border-b border-outline-variant/20 overflow-hidden
        h-28 sm:h-auto sm:aspect-[3/4]"
    >
      <FeatureCoverLetterTemplatesA4PreviewFit v-if="snapshot" :letter="snapshot" />
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
    </div>

    <div class="p-4 flex flex-col gap-3 flex-1">
      <div class="min-w-0">
        <h2 class="font-bold text-on-surface line-clamp-2">{{ title }}</h2>
        <p v-if="companyName" class="text-sm text-on-surface-variant mt-1 line-clamp-1">{{ companyName }}</p>
        <p v-if="position" class="text-xs text-on-surface-variant/70 mt-0.5 line-clamp-1">{{ position }}</p>
        <p v-if="templateName" class="text-[10px] uppercase tracking-wide text-secondary mt-2">{{ templateName }}</p>
      </div>

      <div class="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p class="text-xs text-on-surface-variant">Modifiée le {{ formatDate(updatedAt) }}</p>
        <NuxtLink
          :to="`/tableau-de-bord/lettres/${id}`"
          class="inline-flex items-center justify-center min-h-11 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-bold whitespace-nowrap"
        >
          Modifier
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
