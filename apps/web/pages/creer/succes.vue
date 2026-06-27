<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()
const resumeStore = useResumeStore()
const route = useRoute()

const downloadedFilename = computed(() => {
  const fromQuery = route.query.file
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery
  if (resumeStore.current) return buildResumePdfFilename(resumeStore.current)
  return 'cv Profiloz.pdf'
})

onMounted(() => {
  authStore.loadFromStorage()
  const container = document.getElementById('confetti-container')
  if (!container) return
  const colors = ['#316bf3', '#71f8e4', '#b4c5ff', '#0051d5']
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = `${Math.random() * 100}%`
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)] ?? '#316bf3'
    el.style.animationDelay = `${Math.random() * 2}s`
    container.appendChild(el)
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="flex justify-between items-center gap-3 px-margin-mobile py-2.5 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-sm shrink-0">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8" />
      <LayoutAuthStatus icon-only class="sm:hidden" />
      <LayoutAuthStatus compact class="hidden sm:flex" />
    </header>
    <div class="flex-1 flex items-center justify-center p-margin-mobile relative overflow-hidden gradient-mesh">
    <div id="confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden" />
    <div class="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-lg p-8 md:p-12 text-center">
      <div class="text-5xl mb-6">🎉</div>
      <h1 class="text-3xl md:text-4xl font-bold text-primary mb-4">Félicitations !</h1>
      <p class="text-lg text-on-surface font-medium mb-2">Votre CV professionnel est prêt.</p>
      <p class="text-on-surface-variant max-w-md mx-auto mb-10">
        Téléchargez-le maintenant ou créez un compte gratuit pour le sauvegarder et le modifier plus tard.
      </p>

      <div v-if="authStore.isAuthenticated" class="space-y-4 mb-8">
        <NuxtLink
          to="/tableau-de-bord"
          class="block w-full bg-primary text-white py-4 px-8 rounded-lg font-bold"
        >
          Voir mes CV
        </NuxtLink>
        <NuxtLink to="/creer/editeur" class="block text-secondary font-semibold hover:underline">
          Continuer à modifier
        </NuxtLink>
      </div>

      <div v-else class="w-full bg-surface-container-low rounded-xl p-6 md:p-8 mb-8 border border-outline-variant/20 text-left">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3">
            <h3 class="font-bold text-primary">Créez un compte gratuit pour sauvegarder votre CV</h3>
            <ul class="space-y-2 text-on-surface-variant text-sm">
              <li class="flex items-center gap-2"><UiPzIcon name="check" class="text-secondary text-[18px]" /> Sauvegarder vos CV</li>
              <li class="flex items-center gap-2"><UiPzIcon name="check" class="text-secondary text-[18px]" /> Créer plusieurs versions</li>
              <li class="flex items-center gap-2"><UiPzIcon name="check" class="text-secondary text-[18px]" /> Accéder à l'historique</li>
            </ul>
          </div>
          <div class="flex flex-col gap-3 min-w-[200px]">
            <NuxtLink
              to="/inscription?redirect=/creer/editeur"
              class="bg-primary text-white py-4 px-8 rounded-lg font-bold text-center"
            >
              Créer un compte
            </NuxtLink>
            <NuxtLink to="/" class="text-secondary py-3 text-center font-semibold hover:underline">
              Continuer sans compte
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-outline-variant/30">
        <UiPzIcon name="picture_as_pdf" class="text-error" />
        <span class="text-sm text-on-surface-variant">{{ downloadedFilename }}</span>
        <UiPzIcon name="download" class="text-on-surface-variant/50 text-[18px]" />
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.gradient-mesh {
  background-color: #f8f9ff;
  background-image:
    radial-gradient(at 0% 0%, rgba(49, 107, 243, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(113, 248, 228, 0.08) 0px, transparent 50%);
}

:global(.confetti-piece) {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall 3s ease-out forwards;
}

@keyframes confetti-fall {
  0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
</style>
