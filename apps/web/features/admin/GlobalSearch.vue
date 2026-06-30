<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const adminService = useAdminService()
const router = useRouter()

const query = ref('')
const open = ref(false)
const loading = ref(false)
const results = ref<Awaited<ReturnType<typeof adminService.search>> | null>(null)

const runSearch = useDebounceFn(async () => {
  const q = query.value.trim()
  if (q.length < 2) {
    results.value = null
    return
  }
  loading.value = true
  try {
    results.value = await adminService.search(q)
    open.value = true
  } catch {
    results.value = null
  } finally {
    loading.value = false
  }
}, 250)

watch(query, () => runSearch())

const flatResults = computed(() => {
  if (!results.value) return []
  return [
    ...results.value.users.map((r) => ({ ...r, group: 'Utilisateurs' })),
    ...results.value.resumes.map((r) => ({ ...r, group: 'CV' })),
    ...results.value.letters.map((r) => ({ ...r, group: 'Lettres' })),
    ...results.value.payments.map((r) => ({ ...r, group: 'Paiements' })),
    ...results.value.organizations.map((r) => ({ ...r, group: 'Organisations' })),
    ...results.value.templates.map((r) => ({ ...r, group: 'Templates' })),
  ]
})

function go(href: string) {
  open.value = false
  query.value = ''
  router.push(href)
}

function onBlur() {
  window.setTimeout(() => { open.value = false }, 150)
}
</script>

<template>
  <div class="relative w-full max-w-xl">
    <div class="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2">
      <UiPzIcon name="search" class="text-on-surface-variant" />
      <input
        v-model="query"
        type="search"
        placeholder="Rechercher utilisateur, CV, paiement…"
        class="w-full bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant"
        @focus="open = query.trim().length >= 2"
        @blur="onBlur"
      >
      <UiPzIcon v-if="loading" name="progress_activity" class="animate-spin text-on-surface-variant text-base" />
    </div>

    <div
      v-if="open && flatResults.length > 0"
      class="absolute z-50 top-full mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg max-h-80 overflow-auto"
    >
      <button
        v-for="item in flatResults"
        :key="`${item.group}-${item.id}`"
        type="button"
        class="w-full text-left px-4 py-3 hover:bg-surface-container border-b border-outline-variant/20 last:border-b-0"
        @mousedown.prevent="go(item.href)"
      >
        <p class="text-xs text-on-surface-variant">{{ item.group }}</p>
        <p class="text-sm font-medium text-on-surface">{{ item.label }}</p>
        <p v-if="item.sublabel" class="text-xs text-on-surface-variant truncate">{{ item.sublabel }}</p>
      </button>
    </div>

    <div
      v-else-if="open && query.trim().length >= 2 && !loading && flatResults.length === 0"
      class="absolute z-50 top-full mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg px-4 py-3 text-sm text-on-surface-variant"
    >
      Aucun résultat.
    </div>
  </div>
</template>
