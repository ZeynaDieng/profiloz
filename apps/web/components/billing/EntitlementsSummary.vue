<script setup lang="ts">
import type { Entitlements } from '~/services/payment.service'
import { summarizeEntitlements } from '~/utils/entitlements-summary'

const props = withDefaults(
  defineProps<{
    entitlements?: Entitlements | null
    compact?: boolean
    showLink?: boolean
  }>(),
  {
    entitlements: undefined,
    compact: false,
    showLink: true,
  },
)

const { fetchEntitlements } = usePaymentEntitlements()

const loading = ref(!props.entitlements)
const localEntitlements = ref<Entitlements | null>(props.entitlements ?? null)

const summary = computed(() => summarizeEntitlements(localEntitlements.value))

watch(
  () => props.entitlements,
  (value) => {
    if (value !== undefined) {
      localEntitlements.value = value
      loading.value = false
    }
  },
)

onMounted(async () => {
  if (props.entitlements !== undefined) return
  loading.value = true
  localEntitlements.value = await fetchEntitlements()
  loading.value = false
})

defineExpose({
  refresh: async () => {
    loading.value = true
    localEntitlements.value = await fetchEntitlements()
    loading.value = false
    return localEntitlements.value
  },
})
</script>

<template>
  <div
    v-if="loading"
    class="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5"
    :class="compact ? 'text-xs' : 'text-sm'"
  >
    <UiSkeleton variant="text" width="70%" />
  </div>

  <div
    v-else-if="summary"
    class="rounded-xl border px-3 py-2.5"
    :class="[
      compact ? 'text-xs' : 'text-sm',
      summary.kind === 'unlimited'
        ? 'border-secondary/30 bg-secondary/5'
        : summary.kind === 'credits'
          ? 'border-outline-variant/30 bg-surface-container-low'
          : 'border-outline-variant/30 bg-surface-container-lowest',
    ]"
  >
    <div class="flex items-start gap-2.5">
      <UiPzIcon
        :name="summary.icon"
        class="shrink-0 mt-0.5"
        :class="summary.kind === 'unlimited' ? 'text-secondary' : 'text-on-surface-variant'"
      />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-on-surface leading-snug">{{ summary.title }}</p>
        <p v-if="summary.detail && !compact" class="text-on-surface-variant mt-0.5 leading-relaxed">
          {{ summary.detail }}
        </p>
        <NuxtLink
          v-if="showLink && summary.kind === 'none'"
          to="/tarifs"
          class="inline-flex items-center gap-1 mt-1.5 text-secondary font-semibold hover:underline"
        >
          Voir les offres
          <UiPzIcon name="arrow_forward" class="text-[14px]" />
        </NuxtLink>
        <NuxtLink
          v-else-if="showLink && summary.kind !== 'none'"
          to="/tarifs"
          class="inline-flex items-center gap-1 mt-1.5 text-secondary/90 font-medium hover:underline text-xs"
        >
          Gérer mon offre
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
