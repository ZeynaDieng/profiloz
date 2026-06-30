<script setup lang="ts">
import type { UserNotification } from '~/services/notification.service'

const authStore = useAuthStore()
const notificationService = useNotificationService()
const { formatDate } = useAdminFormat()

const open = ref(false)
const loading = ref(false)
const notifications = ref<UserNotification[]>([])
const unreadCount = ref(0)

async function load() {
  if (!authStore.isAuthenticated) return
  loading.value = true
  try {
    const result = await notificationService.list()
    notifications.value = result.data
    unreadCount.value = result.unreadCount
  } catch {
    notifications.value = []
    unreadCount.value = 0
  } finally {
    loading.value = false
  }
}

async function markRead(item: UserNotification) {
  if (item.readAt) return
  await notificationService.markRead(item.id)
  item.readAt = new Date().toISOString()
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function markAllRead() {
  await notificationService.markAllRead()
  notifications.value = notifications.value.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
  unreadCount.value = 0
}

onMounted(load)
watch(() => authStore.isAuthenticated, (value) => { if (value) load() })
</script>

<template>
  <div v-if="authStore.isAuthenticated" class="relative">
    <button
      type="button"
      class="relative touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
      aria-label="Notifications"
      @click="open = !open"
    >
      <UiPzIcon name="notifications" />
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg z-50 overflow-hidden"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
        <p class="font-semibold text-sm text-on-surface">Notifications</p>
        <button v-if="unreadCount > 0" type="button" class="text-xs text-secondary font-semibold" @click="markAllRead">
          Tout lire
        </button>
      </div>

      <div v-if="loading" class="p-4"><UiSkeleton variant="rect" height="4rem" /></div>
      <ul v-else-if="notifications.length" class="max-h-80 overflow-auto">
        <li
          v-for="item in notifications"
          :key="item.id"
          class="px-4 py-3 border-b border-outline-variant/10 last:border-b-0 cursor-pointer hover:bg-surface-container"
          :class="!item.readAt ? 'bg-secondary/5' : ''"
          @click="markRead(item)"
        >
          <p class="text-sm font-medium text-on-surface">{{ item.title }}</p>
          <p class="text-xs text-on-surface-variant mt-1 line-clamp-2">{{ item.body }}</p>
          <p class="text-[10px] text-on-surface-variant mt-1">{{ formatDate(item.createdAt, true) }}</p>
        </li>
      </ul>
      <p v-else class="p-4 text-sm text-on-surface-variant">Aucune notification.</p>
    </div>
  </div>
</template>
