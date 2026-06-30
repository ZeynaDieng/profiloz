<script setup lang="ts">
defineProps<{
  items: Array<{ id: string; type: string; message: string; at: string }>
}>()

const { formatDate } = useAdminFormat()

const iconByType: Record<string, string> = {
  signup: 'person_add',
  resume: 'description',
  letter: 'mail',
  payment: 'payments',
  organization: 'domain',
  pdf: 'picture_as_pdf',
}
</script>

<template>
  <UiCard padding="lg" class="h-full">
    <h3 class="font-semibold text-on-surface mb-4">Activité récente</h3>
    <div v-if="items.length === 0" class="text-sm text-on-surface-variant">Aucune activité récente.</div>
    <ul v-else class="space-y-3">
      <li v-for="item in items" :key="item.id" class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
          <UiPzIcon :name="iconByType[item.type] || 'history'" class="text-secondary text-base" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm text-on-surface">{{ item.message }}</p>
          <p class="text-xs text-on-surface-variant mt-0.5">{{ formatDate(item.at, true) }}</p>
        </div>
      </li>
    </ul>
  </UiCard>
</template>
