<script setup lang="ts">
import type { Entitlements } from '~/services/payment.service'
import { listOfferFeatures, summarizeEntitlements } from '~/utils/entitlements-summary'

const { fetchEntitlements } = usePaymentEntitlements()

const loading = ref(true)
const loadError = ref(false)
const entitlements = ref<Entitlements | null>(null)

const summary = computed(() => summarizeEntitlements(entitlements.value))
const features = computed(() =>
  entitlements.value ? listOfferFeatures(entitlements.value) : [],
)

const statusClass = computed(() => {
  if (!summary.value) return 'border-outline-variant/30 bg-surface-container-lowest'
  switch (summary.value.kind) {
    case 'unlimited':
      return 'border-secondary/30 bg-secondary/5'
    case 'credits':
    case 'dossier_active':
      return 'border-outline-variant/30 bg-surface-container-low'
    default:
      return 'border-outline-variant/30 bg-surface-container-lowest'
  }
})

async function load() {
  loading.value = true
  loadError.value = false
  entitlements.value = await fetchEntitlements()
  if (!entitlements.value) loadError.value = true
  loading.value = false
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="space-y-2">
      <UiSkeleton variant="text" width="55%" />
      <UiSkeleton variant="text" width="85%" />
      <UiSkeleton variant="text" width="70%" />
    </div>

    <div v-else-if="loadError" class="space-y-2">
      <UiMessageBanner
        variant="warning"
        message="Impossible de charger votre offre pour le moment."
        class="text-left"
      />
      <UiButton variant="ghost" size="sm" @click="load">Réessayer</UiButton>
    </div>

    <template v-else-if="summary">
      <div class="rounded-xl border px-4 py-3.5" :class="statusClass">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="summary.kind === 'unlimited' ? 'bg-secondary/15 text-secondary' : 'bg-surface-container text-on-surface-variant'"
          >
            <UiPzIcon :name="summary.icon" class="text-xl" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-on-surface">{{ summary.title }}</p>
            <p v-if="summary.detail" class="text-sm text-on-surface-variant mt-1 leading-relaxed">
              {{ summary.detail }}
            </p>
          </div>
        </div>
      </div>

      <ul v-if="features.length" class="space-y-2">
        <li
          v-for="feature in features"
          :key="feature"
          class="flex items-start gap-2 text-sm text-on-surface"
        >
          <UiPzIcon name="check_circle" class="text-secondary shrink-0 mt-0.5 text-[18px]" />
          <span>{{ feature }}</span>
        </li>
      </ul>

      <div class="flex flex-wrap gap-2 pt-1">
        <NuxtLink v-if="summary.kind === 'none'" to="/tarifs">
          <UiButton variant="secondary" size="sm" icon="shopping_bag">
            Voir les offres
          </UiButton>
        </NuxtLink>
        <NuxtLink v-else-if="summary.kind !== 'unlimited'" to="/tarifs">
          <UiButton variant="outline" size="sm" icon="add">
            Acheter des crédits
          </UiButton>
        </NuxtLink>
        <NuxtLink v-else to="/tarifs">
          <UiButton variant="outline" size="sm" icon="settings">
            Gérer mon abonnement
          </UiButton>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
