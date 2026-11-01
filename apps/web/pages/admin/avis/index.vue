<script setup lang="ts">
import type { Review, ReviewStatus } from '~/services/review.service'

definePageMeta({ layout: 'admin' })

const reviewService = useReviewService()

const filter = ref<ReviewStatus | ''>('PENDING')
const reviews = ref<Review[]>([])
const pending = ref(0)
const loading = ref(true)
const error = ref('')
const busyId = ref<string | null>(null)

const FILTERS: Array<{ value: ReviewStatus | ''; label: string }> = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Publiés' },
  { value: 'REJECTED', label: 'Refusés' },
  { value: '', label: 'Tous' },
]

const STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Publié',
  REJECTED: 'Refusé',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await reviewService.listForAdmin(filter.value)
    reviews.value = result.data
    pending.value = result.pending
  } catch {
    error.value = 'Impossible de charger les avis.'
  } finally {
    loading.value = false
  }
}

async function moderate(review: Review, status: ReviewStatus) {
  busyId.value = review.id
  try {
    await reviewService.moderate(review.id, status)
    await load()
  } catch {
    error.value = 'Action impossible. Réessayez.'
  } finally {
    busyId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

watch(filter, load)
onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader
      title="Avis clients"
      subtitle="Avis laissés par les clients après paiement. Seuls les avis publiés apparaissent sur l’accueil (à partir de 3 avis)."
    />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div class="flex flex-wrap gap-2 mb-gutter">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        type="button"
        class="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors"
        :class="filter === f.value ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'"
        @click="filter = f.value"
      >
        {{ f.label }}<span v-if="f.value === 'PENDING' && pending"> ({{ pending }})</span>
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 3" :key="i" variant="rect" height="7rem" />
    </div>

    <UiCard v-else-if="reviews.length === 0" padding="md">
      <p class="text-sm text-on-surface-variant">Aucun avis dans cette catégorie.</p>
    </UiCard>

    <div v-else class="space-y-4">
      <UiCard v-for="review in reviews" :key="review.id" padding="md">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-1 text-amber-400" :aria-label="`${review.rating} sur 5`">
              <UiPzIcon v-for="star in 5" :key="star" name="star" filled class="text-lg" :class="star > review.rating && 'text-slate-200'" />
            </div>
            <p class="mt-2 text-sm text-on-surface whitespace-pre-line">{{ review.comment }}</p>
            <p class="mt-2 text-xs text-on-surface-variant">
              {{ review.displayName }}<span v-if="review.city"> · {{ review.city }}</span> · {{ formatDate(review.createdAt) }}
            </p>
          </div>
          <span
            class="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            :class="{
              'bg-amber-100 text-amber-800': review.status === 'PENDING',
              'bg-emerald-100 text-emerald-800': review.status === 'APPROVED',
              'bg-slate-100 text-slate-600': review.status === 'REJECTED',
            }"
          >
            {{ STATUS_LABEL[review.status] }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-if="review.status !== 'APPROVED'"
            type="button"
            class="btn-primary text-sm"
            :disabled="busyId === review.id"
            @click="moderate(review, 'APPROVED')"
          >
            Publier
          </button>
          <button
            v-if="review.status !== 'REJECTED'"
            type="button"
            class="btn-outline text-sm"
            :disabled="busyId === review.id"
            @click="moderate(review, 'REJECTED')"
          >
            {{ review.status === 'APPROVED' ? 'Retirer' : 'Refuser' }}
          </button>
        </div>
      </UiCard>
    </div>
  </div>
</template>
