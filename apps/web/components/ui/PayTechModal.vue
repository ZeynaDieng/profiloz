<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  redirectUrl: string | null
  refCommand: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'cancel'): void
}>()

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function openInNewTab() {
  if (props.redirectUrl) {
    window.open(props.redirectUrl, 'PayTechWindow', 'width=520,height=700,top=100,left=100')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue && redirectUrl"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        >
          <!-- Header de la modal -->
          <div class="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                🔒
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Paiement sécurisé PayTech
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Wave · Orange Money · Free Money · Carte
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors"
                title="Ouvrir dans une nouvelle fenêtre si l'affichage intégré stagne"
                @click="openInNewTab"
              >
                Pop-up externe ↗
              </button>
              <button
                type="button"
                class="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors"
                aria-label="Fermer"
                @click="close"
              >
                <UiPzIcon name="close" class="text-lg" />
              </button>
            </div>
          </div>

          <!-- Corps de la modal avec iframe PayTech -->
          <div class="relative flex-1 min-h-[480px] bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <iframe
              :src="redirectUrl"
              class="w-full h-full border-0 min-h-[480px]"
              allow="payment"
              title="Guichet de paiement PayTech"
            />
          </div>

          <!-- Footer statut -->
          <div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>En attente de votre validation Mobile Money...</span>
            </div>

            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-medium"
              @click="close"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
