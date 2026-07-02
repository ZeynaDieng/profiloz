<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
    iconOnly?: boolean
    showGuestBadge?: boolean
    showLoginLink?: boolean
  }>(),
  { compact: false, iconOnly: false, showGuestBadge: true, showLoginLink: true },
)

const route = useRoute()
const authStore = useAuthStore()
const menuOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

onMounted(() => {
  authStore.loadFromStorage()
  authStore.syncSession()
})

onClickOutside(rootRef, () => {
  menuOpen.value = false
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

const userInitial = computed(() => {
  const email = authStore.user?.email ?? '?'
  return email.charAt(0).toUpperCase()
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function onLogout() {
  closeMenu()
  authStore.logout()
  await navigateTo('/')
}
</script>

<template>
  <div ref="rootRef" class="relative flex items-center gap-1 sm:gap-2 shrink-0">
    <template v-if="authStore.isAuthenticated">
      <button
        type="button"
        class="inline-flex items-center rounded-lg hover:bg-surface-container transition-colors"
        :class="iconOnly ? 'min-h-11 min-w-11 justify-center p-0' : 'gap-1.5 sm:gap-2 min-h-11 px-2 sm:px-3 max-w-[220px]'"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        :aria-label="iconOnly ? 'Compte connecté' : 'Menu compte'"
        @click="toggleMenu"
      >
        <span class="relative shrink-0">
          <span
            class="flex items-center justify-center rounded-full bg-secondary/15 text-secondary font-bold"
            :class="iconOnly ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-sm'"
            aria-hidden="true"
          >
            {{ userInitial }}
          </span>
          <span
            v-if="iconOnly"
            class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-surface"
            aria-hidden="true"
          />
        </span>
        <template v-if="!iconOnly">
          <span class="flex flex-col items-start leading-tight min-w-0">
            <span class="text-[11px] font-semibold text-secondary">Connecté</span>
            <span v-if="!compact" class="text-[11px] text-on-surface-variant truncate max-w-[120px] sm:max-w-[160px]">
              {{ authStore.user?.email }}
            </span>
          </span>
          <UiPzIcon
            name="expand_more"
            class="text-[18px] text-on-surface-variant shrink-0 transition-transform duration-200"
            :class="menuOpen ? 'rotate-180' : ''"
          />
        </template>
      </button>

      <div
        v-if="menuOpen"
        class="absolute top-full right-0 mt-1 w-60 rounded-xl border border-outline-variant bg-surface shadow-lg z-60 py-2"
        role="menu"
      >
        <p class="px-4 py-2 text-xs text-on-surface-variant truncate border-b border-outline-variant/30 mb-1">
          {{ authStore.user?.email }}
        </p>
        <NuxtLink
          to="/tableau-de-bord"
          class="flex items-center gap-2 min-h-11 px-4 text-sm text-on-surface hover:bg-surface-container"
          role="menuitem"
          @click="closeMenu"
        >
          <UiPzIcon name="dashboard" class="text-[20px] text-on-surface-variant" />
          Mon tableau de bord
        </NuxtLink>
        <NuxtLink
          to="/creer"
          class="flex items-center gap-2 min-h-11 px-4 text-sm text-on-surface hover:bg-surface-container"
          role="menuitem"
          @click="closeMenu"
        >
          <UiPzIcon name="add" class="text-[20px] text-on-surface-variant" />
          Nouveau dossier
        </NuxtLink>
        <div class="my-1 border-t border-outline-variant/30" />
        <button
          type="button"
          class="w-full flex items-center gap-2 min-h-11 px-4 text-sm text-error hover:bg-surface-container"
          role="menuitem"
          @click="onLogout"
        >
          <UiPzIcon name="logout" class="text-[20px]" />
          Déconnexion
        </button>
      </div>
    </template>

    <template v-else>
      <span
        v-if="showGuestBadge && !iconOnly"
        class="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-1.5 rounded-full"
        title="Mode invité — connectez-vous pour sauvegarder votre CV en ligne"
      >
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
        Invité
      </span>
      <NuxtLink
        v-if="showLoginLink"
        :to="{ path: '/connexion', query: { redirect: $route.fullPath } }"
        class="font-label-sm font-semibold text-on-surface-variant hover:text-secondary transition-colors inline-flex items-center"
        :class="iconOnly ? 'min-h-11 min-w-11 justify-center rounded-xl hover:bg-surface-container' : 'min-h-11 px-2 sm:px-3'"
        :aria-label="iconOnly ? 'Se connecter' : undefined"
      >
        <UiPzIcon v-if="iconOnly" name="login" class="text-[22px]" />
        <span v-else>Se connecter</span>
      </NuxtLink>
    </template>
  </div>
</template>
