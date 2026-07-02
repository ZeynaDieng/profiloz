<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { formatNumber, formatMs } = useAdminFormat()

const stats = ref<Record<string, unknown> | null>(null)
const feedbackInsights = ref<Awaited<ReturnType<typeof adminService.getImportFeedbackInsights>> | null>(null)
const loading = ref(true)
const error = ref('')

type DebugTab = 'preview' | 'raw' | 'blocks' | 'sections' | 'parsed' | 'confidence' | 'issues'

const debugFile = ref<File | null>(null)
const debugLoading = ref(false)
const debugError = ref('')
const debugReport = ref<Record<string, unknown> | null>(null)
const debugTab = ref<DebugTab>('preview')

onMounted(async () => {
  try {
    const [ocrStats, feedback] = await Promise.all([
      adminService.getOcrStats(),
      adminService.getImportFeedbackInsights(),
    ])
    stats.value = ocrStats
    feedbackInsights.value = feedback
  } catch {
    error.value = 'Impossible de charger les statistiques OCR.'
  } finally {
    loading.value = false
  }
})

const formats = computed(() => (stats.value?.formats as Array<{ mimeType: string; count: number }>) ?? [])
const errors = computed(() => (stats.value?.recentErrors as Array<{ id: string; name: string; at: string }>) ?? [])
const feedbackCategories = computed(() => feedbackInsights.value?.byCategory ?? [])
const feedbackRecent = computed(() => feedbackInsights.value?.recent ?? [])

const extraction = computed(() => debugReport.value?.extraction as Record<string, unknown> | undefined)
const parsed = computed(() => debugReport.value?.parsed as Record<string, unknown> | undefined)
const quality = computed(() => debugReport.value?.quality as Record<string, unknown> | undefined)
const blocks = computed(() => (debugReport.value?.blocks as Array<Record<string, unknown>>) ?? [])
const lines = computed(() => (debugReport.value?.lines as string[]) ?? [])
const headerLines = computed(() => (debugReport.value?.headerLines as string[]) ?? [])
const detectedSections = computed(() => (debugReport.value?.detectedSections as string[]) ?? [])
const previewDataUrl = computed(() => debugReport.value?.previewDataUrl as string | undefined)
const confidenceParsed = computed(() => (parsed.value?._extraction as Record<string, unknown> | undefined)?.confidence as Record<string, unknown> | undefined)

async function runDebug() {
  if (!debugFile.value) return
  debugLoading.value = true
  debugError.value = ''
  debugReport.value = null
  try {
    debugReport.value = await adminService.debugOcr(debugFile.value)
    debugTab.value = 'preview'
  } catch {
    debugError.value = 'Analyse debug impossible. Vérifiez le format du fichier.'
  } finally {
    debugLoading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  debugFile.value = input.files?.[0] ?? null
}

const tabs: Array<{ id: DebugTab; label: string }> = [
  { id: 'preview', label: 'Document' },
  { id: 'raw', label: 'Texte brut' },
  { id: 'blocks', label: 'Blocs / colonnes' },
  { id: 'sections', label: 'Sections' },
  { id: 'parsed', label: 'Données extraites' },
  { id: 'confidence', label: 'Confiance' },
  { id: 'issues', label: 'Avertissements' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="OCR & Import" subtitle="Statistiques production et mode debug (admin)." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="7rem" />
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        <AdminStatCard label="Fichiers analysés" :value="formatNumber(Number(stats.analyzedFiles))" />
        <AdminStatCard label="Taux de réussite" :value="`${stats.successRate} %`" />
        <AdminStatCard label="Temps moyen" :value="formatMs(Number(stats.averageProcessingMs))" />
        <AdminStatCard label="Erreurs" :value="formatNumber(Number(stats.failed))" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-gutter">
        <UiCard padding="lg">
          <h3 class="font-semibold text-on-surface mb-3">Formats utilisés</h3>
          <ul class="space-y-2">
            <li v-for="f in formats" :key="f.mimeType" class="flex justify-between text-sm">
              <span class="text-on-surface-variant">{{ f.mimeType }}</span>
              <span class="font-semibold">{{ f.count }}</span>
            </li>
          </ul>
        </UiCard>

        <UiCard padding="lg">
          <h3 class="font-semibold text-on-surface mb-3">Erreurs récentes</h3>
          <ul v-if="errors.length" class="space-y-2 text-sm">
            <li v-for="e in errors" :key="e.id" class="flex justify-between gap-2">
              <span class="truncate">{{ e.name }}</span>
              <AdminStatusBadge status="FAILED" />
            </li>
          </ul>
          <p v-else class="text-sm text-on-surface-variant">Aucune erreur récente.</p>
        </UiCard>
      </div>
    </template>

    <UiCard v-if="feedbackInsights" padding="lg" class="mb-gutter">
      <h3 class="font-semibold text-on-surface mb-1">Amélioration continue</h3>
      <p class="text-sm text-on-surface-variant mb-4">
        Corrections utilisateur après import — priorisez les extracteurs à renforcer.
      </p>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter mb-4">
        <AdminStatCard label="Retours enregistrés" :value="formatNumber(feedbackInsights.total)" />
        <AdminStatCard label="Échantillon récent" :value="formatNumber(feedbackInsights.recentSampleSize)" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div>
          <h4 class="text-sm font-semibold text-on-surface mb-2">Champs les plus corrigés</h4>
          <ul v-if="feedbackCategories.length" class="space-y-2 text-sm">
            <li v-for="row in feedbackCategories" :key="row.category" class="flex justify-between gap-2">
              <span class="text-on-surface-variant">{{ row.category }}</span>
              <span class="font-semibold">{{ row.count }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-on-surface-variant">Aucune correction enregistrée pour l'instant.</p>
        </div>

        <div>
          <h4 class="text-sm font-semibold text-on-surface mb-2">Imports récents corrigés</h4>
          <ul v-if="feedbackRecent.length" class="space-y-2 text-sm">
            <li v-for="row in feedbackRecent.slice(0, 8)" :key="row.id" class="flex justify-between gap-2">
              <span class="truncate">{{ row.fileName ?? row.id }}</span>
              <span class="text-on-surface-variant shrink-0">{{ row.correctionCount }} modif.</span>
            </li>
          </ul>
          <p v-else class="text-sm text-on-surface-variant">Les retours apparaîtront après les premiers imports corrigés.</p>
        </div>
      </div>
    </UiCard>

    <UiCard padding="lg" class="mt-gutter">
      <h3 class="font-semibold text-on-surface mb-1">Mode Debug OCR</h3>
      <p class="text-sm text-on-surface-variant mb-4">
        Analyse complète d'un CV : texte brut, blocs, sections, extraction, confiance et avertissements.
      </p>

      <div class="flex flex-wrap items-end gap-3 mb-4">
        <label class="flex-1 min-w-[220px]">
          <span class="text-xs text-on-surface-variant block mb-1">Fichier CV (PDF, DOCX, JPG, PNG)</span>
          <input
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            class="block w-full text-sm"
            @change="onFileChange"
          />
        </label>
        <UiButton variant="secondary" :disabled="!debugFile || debugLoading" @click="runDebug">
          {{ debugLoading ? 'Analyse…' : 'Analyser' }}
        </UiButton>
      </div>

      <UiMessageBanner v-if="debugError" variant="error" :message="debugError" class="mb-4" />

      <div v-if="debugReport" class="space-y-4">
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="px-2 py-1 rounded bg-surface-container-high">{{ debugReport.fileName }}</span>
          <span class="px-2 py-1 rounded bg-surface-container-high">{{ debugReport.mimeType }}</span>
          <span class="px-2 py-1 rounded bg-surface-container-high">{{ formatMs(Number(debugReport.durationMs)) }}</span>
          <span v-if="extraction?.method" class="px-2 py-1 rounded bg-surface-container-high">{{ extraction.method }}</span>
          <span v-if="extraction?.multiColumn" class="px-2 py-1 rounded bg-amber-500/10 text-amber-700">
            {{ extraction.columnCount }} colonne(s)
          </span>
        </div>

        <div class="flex flex-wrap gap-1 border-b border-outline-variant pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            :class="debugTab === tab.id ? 'bg-secondary text-white' : 'text-on-surface-variant hover:bg-surface-container-high'"
            @click="debugTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="debugTab === 'preview'" class="space-y-3">
          <img
            v-if="previewDataUrl"
            :src="previewDataUrl"
            alt="Aperçu du document"
            class="max-h-[480px] rounded-lg border border-outline-variant mx-auto"
          />
          <p v-else class="text-sm text-on-surface-variant">Aperçu non disponible pour ce format (DOCX, etc.).</p>
        </div>

        <pre v-else-if="debugTab === 'raw'" class="text-xs bg-surface-container-low p-3 rounded-lg overflow-auto max-h-[480px] whitespace-pre-wrap">{{ extraction?.rawText || '(vide)' }}</pre>

        <div v-else-if="debugTab === 'blocks'" class="space-y-3 text-sm max-h-[480px] overflow-auto">
          <div>
            <h4 class="font-semibold mb-1">En-tête ({{ headerLines.length }} lignes)</h4>
            <pre class="text-xs bg-surface-container-low p-2 rounded whitespace-pre-wrap">{{ headerLines.join('\n') || '(vide)' }}</pre>
          </div>
          <div>
            <h4 class="font-semibold mb-1">Colonnes détectées</h4>
            <p class="text-xs text-on-surface-variant">
              Multi-colonnes : {{ extraction?.multiColumn ? 'oui' : 'non' }} — {{ extraction?.columnCount ?? 1 }} colonne(s)
            </p>
          </div>
          <div v-for="(block, i) in blocks" :key="i" class="border border-outline-variant rounded-lg p-2">
            <p class="text-xs font-bold text-secondary mb-1">{{ block.kind }} (l. {{ block.startLine }}–{{ block.endLine }})</p>
            <pre class="text-xs whitespace-pre-wrap">{{ (block.lines as string[])?.join('\n') }}</pre>
          </div>
        </div>

        <div v-else-if="debugTab === 'sections'" class="space-y-2">
          <p class="text-sm">Sections reconnues :</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="s in detectedSections" :key="s" class="text-xs px-2 py-1 rounded bg-[#14B8A6]/10 text-[#14B8A6] font-semibold">{{ s }}</span>
          </div>
          <p v-if="!detectedSections.length" class="text-sm text-on-surface-variant">Aucune section détectée.</p>
        </div>

        <pre v-else-if="debugTab === 'parsed'" class="text-xs bg-surface-container-low p-3 rounded-lg overflow-auto max-h-[480px]">{{ JSON.stringify(parsed, null, 2) }}</pre>

        <pre v-else-if="debugTab === 'confidence'" class="text-xs bg-surface-container-low p-3 rounded-lg overflow-auto max-h-[480px]">{{ JSON.stringify(confidenceParsed, null, 2) }}</pre>

        <div v-else-if="debugTab === 'issues'" class="space-y-4 text-sm max-h-[480px] overflow-auto">
          <div>
            <h4 class="font-semibold mb-1">Avertissements OCR</h4>
            <ul v-if="(extraction?.warnings as string[])?.length" class="list-disc pl-4 space-y-1 text-xs">
              <li v-for="(w, i) in extraction?.warnings as string[]" :key="`w-${i}`">{{ w }}</li>
            </ul>
            <p v-else class="text-xs text-on-surface-variant">Aucun avertissement.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-1">Erreurs contournées</h4>
            <ul v-if="(extraction?.errors as string[])?.length" class="list-disc pl-4 space-y-1 text-xs text-error">
              <li v-for="(e, i) in extraction?.errors as string[]" :key="`e-${i}`">{{ e }}</li>
            </ul>
            <p v-else class="text-xs text-on-surface-variant">Aucune erreur.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-1">Informations non classées</h4>
            <ul v-if="(quality?.orphanLines as string[])?.length" class="list-disc pl-4 space-y-1 text-xs">
              <li v-for="(o, i) in quality?.orphanLines as string[]" :key="`o-${i}`">{{ o }}</li>
            </ul>
            <p v-else class="text-xs text-on-surface-variant">Rien en suspens.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-1">Drapeaux qualité</h4>
            <ul v-if="(quality?.redFlags as string[])?.length" class="list-disc pl-4 space-y-1 text-xs">
              <li v-for="(f, i) in quality?.redFlags as string[]" :key="`f-${i}`">{{ f }}</li>
            </ul>
            <p v-else class="text-xs text-on-surface-variant">Aucun drapeau.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-1">Éléments à vérifier (review)</h4>
            <pre class="text-xs bg-surface-container-low p-2 rounded">{{ JSON.stringify((parsed?._extraction as Record<string, unknown>)?.review, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
